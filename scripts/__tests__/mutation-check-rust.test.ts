import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  matchRustMutants,
  parseListedMutants,
  parseOutcomes,
  parseRustLedger,
  installFailure,
  rustDiff,
  runRustMutation,
  rustFailures,
  rustSourcePaths,
  serializeRustLedger,
  type RustLedgerEntry,
  type RustMutant,
  type RustOutcome,
} from '../mutation-check-rust.ts';
import { unsetGitEnvironment } from './support/isolated-git.ts';

// A hook-run test inherits the hook's GIT_* variables, which would point the scratch repositories' git commands at the real repository (./support/isolated-git.ts).
beforeEach(unsetGitEnvironment);
afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it('reads Unviable as unviable', () => {
    const json = outcomesJson([
      {
        scenario: {
          Mutant: jsonMutant('src/a.rs', 7, 9, 'replace == with != in check'),
        },
        summary: 'Unviable',
      },
    ]);
    expect(parseOutcomes(json, listed)[0].status).toBe('unviable');
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

  it('reports an entry whose mutant was caught as stale, and one whose mutant did not run or did not get caught as not stale', () => {
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
    for (const status of ['missed', 'unviable'] as const) {
      expect(
        matchRustMutants({
          ledger: [entry()],
          listed,
          outcomes: [outcome(status)],
        }).stale,
      ).toEqual([]);
    }
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

describe('mutation-check-rust parsing and wording', () => {
  it('lists mutants of one line in column order whatever order cargo gave them', () => {
    const listed = parseListedMutants(
      JSON.stringify([
        jsonMutant('src/lib.rs', 4, 12, 'replace b with ()'),
        jsonMutant('src/lib.rs', 4, 5, 'replace a with ()'),
      ]),
    );

    expect(listed.map(({ column }) => column)).toEqual([5, 12]);
  });

  it('finds the listed mutant of an outcome by file, line, column and change together', () => {
    const listed = parseListedMutants(
      JSON.stringify([
        jsonMutant('src/a.rs', 1, 1, 'replace x with ()'),
        jsonMutant('src/a.rs', 3, 3, 'replace x with ()'),
        jsonMutant('src/b.rs', 3, 3, 'replace x with ()'),
        jsonMutant('src/b.rs', 4, 3, 'replace x with ()'),
        jsonMutant('src/b.rs', 4, 9, 'replace x with ()'),
        jsonMutant('src/b.rs', 4, 9, 'replace y with ()'),
      ]),
    );
    const outcomeOf = (
      file: string,
      line: number,
      column: number,
      change: string,
    ) =>
      JSON.stringify({
        outcomes: [
          {
            scenario: { Mutant: jsonMutant(file, line, column, change) },
            summary: 'MissedMutant',
          },
        ],
      });

    expect(
      parseOutcomes(outcomeOf('src/b.rs', 3, 3, 'replace x with ()'), listed)[0]
        .occurrence,
    ).toBe(0);
    expect(
      parseOutcomes(outcomeOf('src/b.rs', 4, 3, 'replace x with ()'), listed)[0]
        .occurrence,
    ).toBe(1);
    expect(
      parseOutcomes(outcomeOf('src/b.rs', 4, 9, 'replace x with ()'), listed)[0]
        .occurrence,
    ).toBe(2);
    expect(
      parseOutcomes(outcomeOf('src/b.rs', 4, 9, 'replace y with ()'), listed)[0]
        .occurrence,
    ).toBe(0);
  });

  const thrownBy = (run: () => unknown) => {
    try {
      run();
    } catch (error) {
      return error;
    }
    return null;
  };

  it.each([
    ['a number', '[1]'],
    ['a string', '["x"]'],
    ['null', '[null]'],
    ['an array', '[[]]'],
  ])('refuses a ledger entry that is %s, naming its index', (_name, json) => {
    expect(thrownBy(() => parseRustLedger(json))).toEqual(
      new Error('Rust ledger entry 0: entry is not an object'),
    );
  });

  it('names the field of an entry that is not a ledger field', () => {
    expect(thrownBy(() => parseRustLedger('[{"extra": 1}]'))).toEqual(
      new Error('Rust ledger entry 0: extra is not a ledger field'),
    );
  });

  it('sorts the serialized entries by file, then change, then occurrence', () => {
    const text = serializeRustLedger([
      entry({ file: 'src/z.rs' }),
      entry({ file: 'src/a.rs', mutant: 'replace b with ()' }),
      entry({ file: 'src/a.rs', mutant: 'replace a with ()', occurrence: 1 }),
      entry({ file: 'src/a.rs', mutant: 'replace a with ()', occurrence: 0 }),
    ]);

    expect(
      (JSON.parse(text) as RustLedgerEntry[]).map(
        ({ file, mutant, occurrence }) => `${file} ${mutant} ${occurrence}`,
      ),
    ).toEqual([
      'src/a.rs replace a with () 0',
      'src/a.rs replace a with () 1',
      'src/a.rs replace b with () 0',
      'src/z.rs replace run with () 0',
    ]);
  });

  it('leaves a caught mutant with no entry out of the unmatched ones', () => {
    const result = matchRustMutants({
      ledger: [],
      listed: [mutant()],
      outcomes: [outcome('caught')],
    });

    expect(result.unmatched).toEqual([]);
  });

  it('words the three failure messages exactly, with the occurrence only when it is above 0', () => {
    const failures = rustFailures({
      status: 2,
      match: {
        unmatched: [
          outcome('missed', { line: 12, column: 3 }),
          outcome('missed', { line: 14, column: 3, occurrence: 2 }),
        ],
        stale: [
          entry({ occurrence: 1 }),
          entry({ mutant: 'replace old with ()' }),
        ],
        missing: [
          entry({ mutant: 'replace removed with ()' }),
          entry({ file: 'src/other.rs', mutant: 'replace gone with ()' }),
        ],
      },
    });

    expect(failures).toEqual([
      '2 Rust mutant(s) were missed; the tests pass with this logic changed. Add a test that fails on each, or, for a mutant no test can observe, accept it with --accept "<reason>":\n  app/src-tauri/src/lib.rs:12:3  replace run with ()\n  app/src-tauri/src/lib.rs:14:3  replace run with () (occurrence 2)',
      '2 entr(y/ies) in scripts/mutation-accepted-rust.json accept a mutant that no longer survives; a test now kills it or the code changed, so remove each:\n  app/src-tauri/src/lib.rs  replace run with () (occurrence 1)\n  app/src-tauri/src/lib.rs  replace old with ()',
      '2 entr(y/ies) in scripts/mutation-accepted-rust.json name a mutant that no longer exists; remove each, and re-run with --accept "<reason>" if the code still has the mutant under another change:\n  app/src-tauri/src/lib.rs  replace removed with ()\n  app/src-tauri/src/other.rs  replace gone with ()',
    ]);
  });

  it('fails an exit status that is no key of the known failures without a meaning, and with no match to judge for it', () => {
    expect(rustFailures({ status: 99, match: null })).toEqual([
      'cargo mutants exited with 99.',
    ]);
    expect(rustFailures({ status: 2, match: null })).toEqual([]);
  });
});

describe('rustDiff failure and assembly', () => {
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

  beforeEach(() => {
    repository = mkdtempSync(path.join(tmpdir(), 'mutation-check-rust-'));
    git('init', '--quiet');
    write('app/src-tauri/src/a.rs', ['one', 'two']);
    git('add', '.');
    git('commit', '--quiet', '-m', 'base');
  });

  afterEach(() => {
    rmSync(repository, { recursive: true, force: true });
  });

  it('throws the git command and its message for a base that does not exist', () => {
    expect(() =>
      rustDiff({ repositoryRoot: repository, base: 'no-such-ref' }),
    ).toThrow(
      /^git diff -M --relative --unified=0 --no-color --no-ext-diff --diff-filter=d no-such-ref -- src failed: fatal: [\s\S]*$/,
    );
  });

  it('reads a diff of more than a few hundred bytes whole', () => {
    const manyLines = Array.from(
      { length: 200 },
      (_, index) => `fn item_${index}() {}`,
    );
    write('app/src-tauri/src/a.rs', manyLines);

    const diff = rustDiff({
      repositoryRoot: repository,
      base: git('rev-parse', 'HEAD').trim(),
    });

    expect(diff.length).toBeGreaterThan(3000);
    expect(diff).toContain('+fn item_199() {}');
  });

  it('joins the changes of tracked and untracked files with nothing between them', () => {
    write('app/src-tauri/src/a.rs', ['one', 'changed']);
    write('app/src-tauri/src/new.rs', ['fn one() {}']);

    const diff = rustDiff({
      repositoryRoot: repository,
      base: git('rev-parse', 'HEAD').trim(),
    });

    for (const line of diff.split('\n')) {
      expect(line).toMatch(
        /^(diff --git |index |--- |\+\+\+ |@@ |\+|-|new file mode|$)/,
      );
    }
    expect(diff).toContain('+++ b/src/a.rs');
    expect(diff).toContain('+++ b/src/new.rs');
  });
});

describe('runRustMutation with a stand-in cargo', () => {
  let repository: string;
  let toolDirectory: string;
  let rustRoot: string;
  const LISTED = JSON.stringify([
    jsonMutant('src/lib.rs', 10, 5, 'replace run with ()'),
    jsonMutant('src/lib.rs', 20, 3, 'replace stop with ()'),
  ]);
  const outcomesJson = (...summaries: [string, string][]) =>
    JSON.stringify({
      outcomes: [
        { scenario: 'Baseline', summary: 'Success' },
        ...summaries.map(([change, summary]) => ({
          scenario: {
            Mutant: change.includes('run')
              ? jsonMutant('src/lib.rs', 10, 5, change)
              : jsonMutant('src/lib.rs', 20, 3, change),
          },
          summary,
        })),
      ],
    });
  const log = () =>
    readFileSync(path.join(toolDirectory, 'cargo.log'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => line.replace(`${realpathSync(rustRoot)}|`, 'ROOT|'));

  const standIn = [
    '#!/bin/sh',
    'printf "%s|%s\\n" "$PWD" "$*" >> "$FAKE_LOG"',
    'case "$2" in',
    '  --version) exit "${FAKE_VERSION_STATUS:-0}" ;;',
    '  --list) cat "$FAKE_LIST_FILE"; exit 0 ;;',
    'esac',
    'if [ "$2" = "--in-diff" ]; then cp "$3" "$FAKE_DIFF_COPY"; printf "%s" "$3" > "$FAKE_DIFF_PATH"; fi',
    'if [ -n "$FAKE_OUTCOMES_FILE" ]; then mkdir -p mutants.out; cp "$FAKE_OUTCOMES_FILE" mutants.out/outcomes.json; fi',
    'exit "${FAKE_RUN_STATUS:-0}"',
    '',
  ].join('\n');

  beforeEach(() => {
    repository = mkdtempSync(path.join(tmpdir(), 'mutation-check-rust-test-'));
    rustRoot = path.join(repository, 'app', 'src-tauri');
    mkdirSync(path.join(rustRoot, 'src'), { recursive: true });
    writeFileSync(path.join(rustRoot, 'src', 'lib.rs'), 'fn run() {}\n');
    toolDirectory = mkdtempSync(path.join(tmpdir(), 'fake-cargo-'));
    writeFileSync(path.join(toolDirectory, 'cargo'), standIn);
    chmodSync(path.join(toolDirectory, 'cargo'), 0o755);
    writeFileSync(path.join(toolDirectory, 'list.json'), LISTED);
    vi.stubEnv('PATH', `${toolDirectory}:${process.env.PATH ?? ''}`);
    vi.stubEnv('FAKE_LOG', path.join(toolDirectory, 'cargo.log'));
    vi.stubEnv('FAKE_LIST_FILE', path.join(toolDirectory, 'list.json'));
    vi.stubEnv('FAKE_DIFF_COPY', path.join(toolDirectory, 'diff.copy'));
    vi.stubEnv('FAKE_DIFF_PATH', path.join(toolDirectory, 'diff.path'));
    vi.stubEnv('FAKE_OUTCOMES_FILE', '');
    vi.stubEnv('FAKE_RUN_STATUS', '0');
    vi.stubEnv('FAKE_VERSION_STATUS', '0');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(repository, { recursive: true, force: true });
    rmSync(toolDirectory, { recursive: true, force: true });
  });

  const withOutcomes = (json: string, status = 2) => {
    writeFileSync(path.join(toolDirectory, 'outcomes.json'), json);
    vi.stubEnv('FAKE_OUTCOMES_FILE', path.join(toolDirectory, 'outcomes.json'));
    vi.stubEnv('FAKE_RUN_STATUS', String(status));
  };

  const run = (
    overrides: Partial<Parameters<typeof runRustMutation>[0]> = {},
  ) =>
    runRustMutation({
      repositoryRoot: repository,
      base: null,
      ledger: [],
      acceptReason: null,
      ...overrides,
    });

  it('stops with the install message, running nothing else, when cargo-mutants does not run', () => {
    vi.stubEnv('FAKE_VERSION_STATUS', '1');

    const result = run();

    expect(result.failures).toEqual([
      'cargo-mutants is not installed, and the mutation check of app/src-tauri/src/ needs it; install it with `cargo install --locked cargo-mutants`.',
    ]);
    expect(result.newEntries).toEqual([]);
    expect(log()).toEqual(['ROOT|mutants --version']);
  });

  it('lists the mutants, then runs every one of them from app/src-tauri when there is no base', () => {
    run();

    expect(log()).toEqual([
      'ROOT|mutants --version',
      'ROOT|mutants --list --json',
      'ROOT|mutants',
    ]);
  });

  it('fails the missed mutants that have no entry, and passes them with one', () => {
    withOutcomes(
      outcomesJson(
        ['replace run with ()', 'MissedMutant'],
        ['replace stop with ()', 'CaughtMutant'],
      ),
    );

    const missed = run();
    expect(missed.failures).toHaveLength(1);
    expect(missed.failures[0]).toMatch(/^1 Rust mutant\(s\) were missed/);
    expect(missed.failures[0]).toContain(
      'src/lib.rs:10:5  replace run with ()',
    );
    expect(missed.newEntries).toEqual([]);

    const accepted = run({
      ledger: [
        {
          file: 'src/lib.rs',
          mutant: 'replace run with ()',
          occurrence: 0,
          reason: 'no test starts run',
        },
      ],
    });
    expect(accepted.failures).toEqual([]);
  });

  it('writes an entry with the reason for each missed mutant without one and fails none of them when asked to accept', () => {
    withOutcomes(outcomesJson(['replace run with ()', 'MissedMutant']));

    const result = run({ acceptReason: 'no test starts run' });

    expect(result.failures).toEqual([]);
    expect(result.newEntries).toEqual([
      {
        file: 'src/lib.rs',
        mutant: 'replace run with ()',
        occurrence: 0,
        reason: 'no test starts run',
      },
    ]);
  });

  it('reports an entry as stale when its mutant was caught and as missing when its mutant is not listed', () => {
    withOutcomes(outcomesJson(['replace run with ()', 'CaughtMutant']));

    const result = run({
      ledger: [
        {
          file: 'src/lib.rs',
          mutant: 'replace run with ()',
          occurrence: 0,
          reason: 'r',
        },
        {
          file: 'src/lib.rs',
          mutant: 'replace gone with ()',
          occurrence: 0,
          reason: 'r',
        },
      ],
    });

    expect(result.failures).toHaveLength(2);
    expect(result.failures[0]).toMatch(
      /accept a mutant that no longer survives/,
    );
    expect(result.failures[1]).toMatch(/name a mutant that no longer exists/);
  });

  it.each([
    [0, 'Caught'],
    [2, 'Missed'],
  ])('reads the outcomes after exit status %s', (status) => {
    withOutcomes(outcomesJson(['replace run with ()', 'MissedMutant']), status);

    expect(run().failures).toHaveLength(1);
  });

  it('fails an exit status other than 0 and 2 on its own and reads no outcomes for it', () => {
    withOutcomes(outcomesJson(['replace run with ()', 'MissedMutant']), 3);

    expect(run().failures).toEqual([
      'cargo mutants exited with 3: a mutant timed out.',
    ]);
  });

  it('writes no entry for a run that ended with another exit status than 0 and 2', () => {
    withOutcomes(outcomesJson(['replace run with ()', 'MissedMutant']), 3);

    expect(run({ acceptReason: 'no test starts run' }).newEntries).toEqual([]);
  });

  it('passes a clean run that left no outcomes file', () => {
    expect(run().failures).toEqual([]);
  });

  it('runs only the diff against the base from a scratch folder that it removes afterwards', () => {
    execFileSync('git', ['init', '--quiet'], { cwd: repository });
    execFileSync(
      'git',
      [
        '-c',
        'user.name=t',
        '-c',
        'user.email=t@e.x',
        '-c',
        'commit.gpgsign=false',
        'commit',
        '--quiet',
        '--allow-empty',
        '-m',
        'base',
      ],
      { cwd: repository },
    );
    const baseRef = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repository,
      encoding: 'utf8',
    }).trim();

    run({ base: baseRef });

    const diffPath = readFileSync(
      path.join(toolDirectory, 'diff.path'),
      'utf8',
    );
    expect(log().at(-1)).toBe(`ROOT|mutants --in-diff ${diffPath}`);
    expect(path.basename(diffPath)).toBe('changes.diff');
    expect(path.basename(path.dirname(diffPath))).toMatch(
      /^mutation-check-rust-/,
    );
    expect(
      readFileSync(path.join(toolDirectory, 'diff.copy'), 'utf8'),
    ).toContain('+++ b/src/lib.rs');
    expect(existsSync(path.dirname(diffPath))).toBe(false);
  });
});
