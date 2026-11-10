import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  matchRustMutants,
  parseListedMutants,
  parseOutcomes,
  parseRustLedger,
  installFailure,
  rustDiff,
  rustFailures,
  rustSourcePaths,
  serializeRustLedger,
  type RustLedgerEntry,
  type RustMutant,
  type RustOutcome,
} from '../mutation-check-rust.ts';

const jsonMutant = (
  file: string,
  line: number,
  column: number,
  change: string,
) => ({
  file,
  name: `${file}:${line}:${column}: ${change}`,
  span: { start: { line, column } },
});

const mutant = (overrides: Partial<RustMutant> = {}): RustMutant => ({
  file: 'src/lib.rs',
  line: 10,
  column: 5,
  mutant: 'replace run with ()',
  occurrence: 0,
  ...overrides,
});

const outcome = (
  status: RustOutcome['status'],
  overrides: Partial<RustMutant> = {},
): RustOutcome => ({ ...mutant(overrides), status });

const entry = (overrides: Partial<RustLedgerEntry> = {}): RustLedgerEntry => ({
  file: 'src/lib.rs',
  mutant: 'replace run with ()',
  occurrence: 0,
  reason: 'run starts the Tauri event loop, which no test starts',
  ...overrides,
});

describe('rustSourcePaths', () => {
  it('keeps the Rust files under app/src-tauri/src/ only', () => {
    expect(
      rustSourcePaths([
        'app/src-tauri/src/lib.rs',
        'app/src-tauri/src/commands/images/mod.rs',
        'app/src-tauri/vendor/iroh-mdns-address-lookup/src/lib.rs',
        'app/src-tauri/tests/tauri_config.rs',
        'app/src-tauri/src/notes.md',
        'app/src/App/App.tsx',
        'src-tauri/src/lib.rs',
      ]),
    ).toEqual([
      'app/src-tauri/src/lib.rs',
      'app/src-tauri/src/commands/images/mod.rs',
    ]);
  });
});

describe('parseListedMutants', () => {
  it('numbers identical changes within a file in source order and strips the position from the change', () => {
    const listed = parseListedMutants(
      JSON.stringify([
        jsonMutant('src/b.rs', 3, 1, 'replace == with != in check'),
        jsonMutant('src/a.rs', 30, 9, 'replace == with != in check'),
        jsonMutant('src/a.rs', 7, 9, 'replace == with != in check'),
        jsonMutant('src/a.rs', 12, 4, 'replace + with - in total'),
      ]),
    );
    expect(listed).toEqual([
      {
        file: 'src/a.rs',
        line: 7,
        column: 9,
        mutant: 'replace == with != in check',
        occurrence: 0,
      },
      {
        file: 'src/a.rs',
        line: 12,
        column: 4,
        mutant: 'replace + with - in total',
        occurrence: 0,
      },
      {
        file: 'src/a.rs',
        line: 30,
        column: 9,
        mutant: 'replace == with != in check',
        occurrence: 1,
      },
      {
        file: 'src/b.rs',
        line: 3,
        column: 1,
        mutant: 'replace == with != in check',
        occurrence: 0,
      },
    ]);
  });

  it('rejects a mutant whose name does not start with its own position', () => {
    expect(() =>
      parseListedMutants(
        JSON.stringify([
          {
            ...jsonMutant('src/a.rs', 7, 9, 'replace x with y'),
            name: 'other',
          },
        ]),
      ),
    ).toThrow(/^mutant "other" does not start with "src\/a\.rs:7:9: "$/);
  });
});

describe('parseOutcomes', () => {
  const listed = parseListedMutants(
    JSON.stringify([
      jsonMutant('src/a.rs', 7, 9, 'replace == with != in check'),
      jsonMutant('src/a.rs', 30, 9, 'replace == with != in check'),
    ]),
  );
  const outcomesJson = (outcomes: { scenario: unknown; summary: string }[]) =>
    JSON.stringify({ outcomes });

  it('skips the baseline and maps each summary to a status, numbering from the full list', () => {
    const json = outcomesJson([
      { scenario: 'Baseline', summary: 'Success' },
      {
        scenario: {
          Mutant: jsonMutant('src/a.rs', 30, 9, 'replace == with != in check'),
        },
        summary: 'MissedMutant',
      },
      {
        scenario: {
          Mutant: jsonMutant('src/a.rs', 7, 9, 'replace == with != in check'),
        },
        summary: 'CaughtMutant',
      },
    ]);
    expect(parseOutcomes(json, listed)).toEqual([
      { ...listed[1], status: 'missed' },
      { ...listed[0], status: 'caught' },
    ]);
  });

  it.each([
    ['Timeout', 'timeout'],
    ['Unviable', 'unviable'],
  ])('reads %s as %s', (summary, status) => {
    const json = outcomesJson([
      {
        scenario: {
          Mutant: jsonMutant('src/a.rs', 7, 9, 'replace == with != in check'),
        },
        summary,
      },
    ]);
    expect(parseOutcomes(json, listed)[0].status).toBe(status);
  });

  it('rejects an unknown summary and a mutant missing from the list', () => {
    const named = (line: number) => ({
      Mutant: jsonMutant('src/a.rs', line, 9, 'replace == with != in check'),
    });
    expect(() =>
      parseOutcomes(
        outcomesJson([{ scenario: named(7), summary: 'Failure' }]),
        listed,
      ),
    ).toThrow(
      /^mutant "src\/a\.rs:7:9: replace == with != in check" has outcome Failure$/,
    );
    expect(() =>
      parseOutcomes(
        outcomesJson([{ scenario: named(99), summary: 'CaughtMutant' }]),
        listed,
      ),
    ).toThrow(
      /^mutant "src\/a\.rs:99:9: replace == with != in check" is not in the list$/,
    );
  });
});

describe('parseRustLedger and serializeRustLedger', () => {
  it('writes entries ordered by file, change and occurrence as two-space JSON with a final newline, and reads them back', () => {
    const entries = [
      entry({ file: 'src/b.rs' }),
      entry({ occurrence: 1 }),
      entry({ mutant: 'replace a with b' }),
      entry(),
    ];
    const text = serializeRustLedger(entries);
    expect(text.endsWith('}\n]\n')).toBe(true);
    expect(text).toContain('\n  {\n    "file": "src/lib.rs",');
    expect(
      parseRustLedger(text).map(({ file, mutant, occurrence }) => [
        file,
        mutant,
        occurrence,
      ]),
    ).toEqual(
      [
        ['src/b.rs', 'replace run with ()', 0],
        ['src/lib.rs', 'replace a with b', 0],
        ['src/lib.rs', 'replace run with ()', 0],
        ['src/lib.rs', 'replace run with ()', 1],
      ].sort(
        (first, second) =>
          String(first[0]).localeCompare(String(second[0])) ||
          String(first[1]).localeCompare(String(second[1])) ||
          Number(first[2]) - Number(second[2]),
      ),
    );
  });

  it.each([
    [
      'a missing reason',
      { reason: undefined },
      'Rust ledger entry 0: reason is missing or not a string',
    ],
    [
      'a blank reason',
      { reason: '  ' },
      'Rust ledger entry 0: reason is empty',
    ],
    [
      'a multi-line reason',
      { reason: 'a\nb' },
      'Rust ledger entry 0: reason spans more than one line',
    ],
    [
      'a negative occurrence',
      { occurrence: -1 },
      'Rust ledger entry 0: occurrence is missing or not a non-negative integer',
    ],
    [
      'a fractional occurrence',
      { occurrence: 0.5 },
      'Rust ledger entry 0: occurrence is missing or not a non-negative integer',
    ],
    [
      'an unknown field',
      { line: 3 },
      'Rust ledger entry 0: line is not a ledger field',
    ],
  ])('rejects %s', (_name, change, message) => {
    expect(() =>
      parseRustLedger(JSON.stringify([{ ...entry(), ...change }])),
    ).toThrow(new RegExp(`^${message}$`));
  });

  it('rejects a ledger that is no array and two entries for one mutant', () => {
    expect(() => parseRustLedger('{}')).toThrow(
      /^the ledger is not a JSON array$/,
    );
    expect(() =>
      parseRustLedger(JSON.stringify([entry(), entry({ reason: 'again' })])),
    ).toThrow(
      /^Rust ledger names app\/src-tauri\/src\/lib\.rs {2}replace run with \(\) twice; one entry per mutant$/,
    );
  });
});

describe('matchRustMutants', () => {
  const listed = [mutant(), mutant({ line: 20, occurrence: 1 })];

  it('reports a missed mutant with no entry as unmatched and accepts one with an entry whatever its line', () => {
    const shifted = outcome('missed', { line: 44 });
    const result = matchRustMutants({
      ledger: [entry()],
      listed,
      outcomes: [shifted, outcome('missed', { line: 20, occurrence: 1 })],
    });
    expect(result.unmatched).toEqual([
      outcome('missed', { line: 20, occurrence: 1 }),
    ]);
  });

  it('matches an entry by its occurrence, so the other identical mutant stays unmatched', () => {
    const result = matchRustMutants({
      ledger: [entry({ occurrence: 1 })],
      listed,
      outcomes: [outcome('missed'), outcome('missed', { occurrence: 1 })],
    });
    expect(result.unmatched).toEqual([outcome('missed')]);
  });

  it('reports an entry whose mutant ran and was caught as stale, and one whose mutant did not run as neither', () => {
    const caught = matchRustMutants({
      ledger: [entry()],
      listed,
      outcomes: [outcome('caught')],
    });
    expect(caught.stale).toEqual([entry()]);
    const notRun = matchRustMutants({
      ledger: [entry()],
      listed,
      outcomes: [],
    });
    expect(notRun.stale).toEqual([]);
    expect(
      matchRustMutants({
        ledger: [entry()],
        listed,
        outcomes: [outcome('missed')],
      }).stale,
    ).toEqual([]);
  });

  it('reports an entry whose mutant is not in the full list as missing', () => {
    const gone = entry({ mutant: 'replace removed with ()' });
    const result = matchRustMutants({
      ledger: [entry(), gone],
      listed,
      outcomes: [],
    });
    expect(result.missing).toEqual([gone]);
  });
});

describe('rustFailures', () => {
  const clean = { unmatched: [], stale: [], missing: [] };

  it.each([
    [0, null],
    [2, null],
  ])(
    'passes exit status %s when nothing is unmatched, stale or missing',
    (status) => {
      expect(rustFailures({ status, match: clean })).toEqual([]);
    },
  );

  it.each([
    [3, 'a mutant timed out'],
    [4, 'the baseline run of the unmutated tests failed'],
    [5, 'the diff does not match the source tree'],
    [6, 'the diff is invalid'],
    [70, 'cargo-mutants hit an internal error'],
  ])('fails exit status %s on its own, naming it', (status, meaning) => {
    expect(rustFailures({ status, match: clean })).toEqual([
      `cargo mutants exited with ${status}: ${meaning}.`,
    ]);
  });

  it('fails an exit status it does not know and a signal', () => {
    expect(rustFailures({ status: 101, match: clean })).toEqual([
      'cargo mutants exited with 101.',
    ]);
    expect(rustFailures({ status: null, match: null })).toEqual([
      'cargo mutants exited with a signal.',
    ]);
  });

  it('names each unmatched mutant, stale entry and missing entry with its own message', () => {
    const failures = rustFailures({
      status: 2,
      match: {
        unmatched: [outcome('missed', { line: 12, column: 3 })],
        stale: [entry({ occurrence: 1 })],
        missing: [entry({ mutant: 'replace removed with ()' })],
      },
    });
    expect(failures).toHaveLength(3);
    expect(failures[0]).toContain(
      'app/src-tauri/src/lib.rs:12:3  replace run with ()',
    );
    expect(failures[1]).toContain(
      'app/src-tauri/src/lib.rs  replace run with () (occurrence 1)',
    );
    expect(failures[2]).toContain('replace removed with ()');
  });
});

describe('installFailure', () => {
  it('names the install command when cargo-mutants does not run, and nothing when it does', () => {
    const message =
      'cargo-mutants is not installed, and the mutation check of app/src-tauri/src/ needs it; install it with `cargo install --locked cargo-mutants`.';
    expect(installFailure(null)).toBe(message);
    expect(installFailure(101)).toBe(message);
    expect(installFailure(0)).toBeNull();
  });
});

describe('rustDiff', () => {
  let repository: string;
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=test',
        '-c',
        'user.email=test@example.com',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd: repository, encoding: 'utf8' },
    );
  const write = (file: string, lines: string[]) => {
    mkdirSync(path.dirname(path.join(repository, file)), { recursive: true });
    writeFileSync(path.join(repository, file), `${lines.join('\n')}\n`);
  };
  const SOURCE = Array.from({ length: 8 }, (_, index) => `line ${index + 1}`);

  beforeEach(() => {
    repository = mkdtempSync(path.join(tmpdir(), 'mutation-check-rust-'));
    git('init', '--quiet');
    write('app/src-tauri/src/a.rs', SOURCE);
    write('app/src-tauri/vendor/crate/src/lib.rs', SOURCE);
    write('app/src/a.ts', SOURCE);
    git('add', '.');
    git('commit', '--quiet', '-m', 'base');
  });

  afterEach(() => {
    rmSync(repository, { recursive: true, force: true });
  });

  const base = () => git('rev-parse', 'HEAD').trim();

  it('holds a changed Rust file relative to app/src-tauri, with zero context', () => {
    write(
      'app/src-tauri/src/a.rs',
      SOURCE.map((line) => (line === 'line 3' ? 'changed' : line)),
    );
    const diff = rustDiff({ repositoryRoot: repository, base: base() });
    expect(diff).toContain('+++ b/src/a.rs');
    expect(diff).toContain('@@ -3 +3 @@');
    expect(diff).not.toContain('app/src-tauri');
  });

  it('holds an untracked Rust file as an added file and leaves out other untracked files', () => {
    write('app/src-tauri/src/new.rs', ['fn one() {}', 'fn two() {}']);
    write('app/src-tauri/src/notes.md', ['notes']);
    const diff = rustDiff({ repositoryRoot: repository, base: base() });
    expect(diff).toContain('+++ b/src/new.rs');
    expect(diff).toContain('@@ -0,0 +1,2 @@');
    expect(diff).not.toContain('notes.md');
  });

  it('leaves out Rust files outside app/src-tauri/src and every non-Rust change', () => {
    write('app/src-tauri/vendor/crate/src/lib.rs', ['vendored']);
    write('app/src/a.ts', ['typescript']);
    expect(rustDiff({ repositoryRoot: repository, base: base() })).toBe('');
  });

  it('includes a change committed after the base and one staged but not committed', () => {
    const start = base();
    write(
      'app/src-tauri/src/a.rs',
      SOURCE.map((line) => (line === 'line 2' ? 'committed' : line)),
    );
    git('commit', '--quiet', '-am', 'change');
    write('app/src-tauri/src/b.rs', ['staged']);
    git('add', 'app/src-tauri/src/b.rs');
    const diff = rustDiff({ repositoryRoot: repository, base: start });
    expect(diff).toContain('+++ b/src/a.rs');
    expect(diff).toContain('+++ b/src/b.rs');
  });
});
