// The Rust half of scripts/mutation-check.ts: `cargo mutants` over the Rust lines a branch added or changed under app/src-tauri/src/, or over all of them with `--all`, judged against scripts/mutation-accepted-rust.json.
// cargo-mutants is a machine tool (`cargo install --locked cargo-mutants`), not a project dependency; app/src-tauri/.cargo/mutants.toml leaves out the networking glue that app/src-tauri/CLAUDE.md — Testing exempts from unit tests.
// A ledger entry names one mutant by its file, its change (cargo-mutants' name without the `file:line:col: ` prefix) and `occurrence`, which counts the earlier mutants of that file with the same change, so a line shift never invalidates it.
// The parsing and matching functions are pure; `rustDiff` and `runRustMutation` run git and cargo.
import { execFileSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { MAX_COMMAND_OUTPUT_BYTES } from './mutation-check-diff.ts';

const RUST_ROOT = 'app/src-tauri';
const RUST_SOURCE_PREFIX = `${RUST_ROOT}/src/`;
const INSTALL_COMMAND = 'cargo install --locked cargo-mutants';

// cargo-mutants' exit codes other than 0 (every mutant caught) and 2 (some missed), https://mutants.rs/exit-codes.html
const FAILURE_EXIT_CODES: Record<number, string> = {
  3: 'a mutant timed out',
  4: 'the baseline run of the unmutated tests failed',
  5: 'the diff does not match the source tree',
  6: 'the diff is invalid',
  70: 'cargo-mutants hit an internal error',
};

// eslint-disable-next-line local/no-unused-exports -- tests type the mutants they build
export type RustMutant = {
  file: string;
  line: number;
  column: number;
  mutant: string;
  occurrence: number;
};

// eslint-disable-next-line local/no-unused-exports -- tests type the outcomes they build
export type RustOutcome = RustMutant & {
  status: 'caught' | 'missed' | 'unviable';
};

// eslint-disable-next-line local/no-unused-exports -- tests type the ledger entries they build
export type RustLedgerEntry = {
  file: string;
  mutant: string;
  occurrence: number;
  reason: string;
};

// The Rust files under app/src-tauri/src/ among repository-root-relative paths: the ones a branch can change the mutated code in.
export const rustSourcePaths = (repositoryPaths: Iterable<string>) =>
  [...repositoryPaths].filter(
    (repositoryPath) =>
      repositoryPath.startsWith(RUST_SOURCE_PREFIX) &&
      repositoryPath.endsWith('.rs'),
  );

type JsonMutant = {
  file: string;
  name: string;
  span: { start: { line: number; column: number } };
};

const mutantOf = ({ file, name, span }: JsonMutant) => {
  const { line, column } = span.start;
  const prefix = `${file}:${line}:${column}: `;
  if (!name.startsWith(prefix))
    throw new Error(`mutant "${name}" does not start with "${prefix}"`);
  return { file, line, column, mutant: name.slice(prefix.length) };
};

const byPosition = (
  first: { file: string; line: number; column: number },
  second: { file: string; line: number; column: number },
) =>
  first.file.localeCompare(second.file) ||
  first.line - second.line ||
  first.column - second.column;

// The mutants of `cargo mutants --list --json`, in file and source order, each numbered among the earlier ones of its file with the same change.
// eslint-disable-next-line local/no-unused-exports -- tests pin the numbering of identical mutants apart from the cargo run
export const parseListedMutants = (json: string): RustMutant[] => {
  const listed = (JSON.parse(json) as JsonMutant[])
    .map(mutantOf)
    .sort(byPosition);
  const seen = new Map<string, number>();
  return listed.map((mutant) => {
    const key = `${mutant.file}\n${mutant.mutant}`;
    const occurrence = seen.get(key) ?? 0;
    seen.set(key, occurrence + 1);
    return { ...mutant, occurrence };
  });
};

// No `Timeout`: cargo-mutants exits 3 whenever a mutant timed out, ahead of 2 for a missed one, and `runRustMutation` reads outcomes only at exit 0 or 2, so a timeout fails the gate through `rustFailures` and a `Timeout` read here is an error.
const STATUS_OF_SUMMARY = new Map<string, RustOutcome['status']>([
  ['CaughtMutant', 'caught'],
  ['MissedMutant', 'missed'],
  ['Unviable', 'unviable'],
]);

// The tested mutants of mutants.out/outcomes.json, each with the occurrence its entry in `listed` (the full list, not only the mutants a diff selected) gives it; the baseline run is no mutant.
// eslint-disable-next-line local/no-unused-exports -- tests pin the reading of outcomes.json apart from the cargo run
export const parseOutcomes = (
  json: string,
  listed: RustMutant[],
): RustOutcome[] => {
  const { outcomes } = JSON.parse(json) as {
    outcomes: {
      scenario: 'Baseline' | { Mutant: JsonMutant };
      summary: string;
    }[];
  };
  return outcomes.flatMap(({ scenario, summary }) => {
    if (scenario === 'Baseline') return [];
    const mutant = mutantOf(scenario.Mutant);
    const status = STATUS_OF_SUMMARY.get(summary) ?? null;
    if (status === null)
      throw new Error(
        `mutant "${scenario.Mutant.name}" has outcome ${summary}`,
      );
    const match =
      listed.find(
        (candidate) =>
          candidate.file === mutant.file &&
          candidate.line === mutant.line &&
          candidate.column === mutant.column &&
          candidate.mutant === mutant.mutant,
      ) ?? null;
    if (match === null)
      throw new Error(`mutant "${scenario.Mutant.name}" is not in the list`);
    return [{ ...mutant, occurrence: match.occurrence, status }];
  });
};

const ENTRY_KEYS = ['file', 'mutant', 'occurrence', 'reason'] as const;

const entryKey = ({
  file,
  mutant,
  occurrence,
}: Pick<RustLedgerEntry, 'file' | 'mutant' | 'occurrence'>) =>
  `${file}\n${mutant}\n${occurrence}`;

export const parseRustLedger = (json: string): RustLedgerEntry[] => {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('the ledger is not a JSON array');
  const entries = parsed.map((value: unknown, index) => {
    const fail = (field: string, problem: string) =>
      new Error(`Rust ledger entry ${index}: ${field} ${problem}`);
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw fail('entry', 'is not an object');
    const entry = value as Record<string, unknown>;
    for (const key of Object.keys(entry)) {
      if (!(ENTRY_KEYS as readonly string[]).includes(key))
        throw fail(key, 'is not a ledger field');
    }
    const text = (field: 'file' | 'mutant' | 'reason') => {
      const fieldValue = entry[field];
      if (typeof fieldValue !== 'string')
        throw fail(field, 'is missing or not a string');
      if (fieldValue.trim() === '') throw fail(field, 'is empty');
      return fieldValue;
    };
    const occurrence = entry.occurrence;
    if (
      typeof occurrence !== 'number' ||
      !Number.isInteger(occurrence) ||
      occurrence < 0
    )
      throw fail('occurrence', 'is missing or not a non-negative integer');
    const reason = text('reason');
    if (reason.includes('\n')) throw fail('reason', 'spans more than one line');
    return { file: text('file'), mutant: text('mutant'), occurrence, reason };
  });
  const keys = new Set<string>();
  for (const entry of entries) {
    if (keys.has(entryKey(entry)))
      throw new Error(
        `Rust ledger names ${describeEntry(entry)} twice; one entry per mutant`,
      );
    keys.add(entryKey(entry));
  }
  return entries;
};

// Ordered by file, change and occurrence as two-space JSON with a final newline, so a rewrite changes only the entries that changed.
export const serializeRustLedger = (entries: RustLedgerEntry[]) =>
  `${JSON.stringify(
    [...entries]
      .sort(
        (first, second) =>
          first.file.localeCompare(second.file) ||
          first.mutant.localeCompare(second.mutant) ||
          first.occurrence - second.occurrence,
      )
      .map(({ file, mutant, occurrence, reason }) => ({
        file,
        mutant,
        occurrence,
        reason,
      })),
    null,
    2,
  )}\n`;

const describeEntry = (
  entry: Pick<RustLedgerEntry, 'file' | 'mutant' | 'occurrence'>,
) =>
  `${RUST_ROOT}/${entry.file}  ${entry.mutant}${entry.occurrence > 0 ? ` (occurrence ${entry.occurrence})` : ''}`;

const describeMutant = (mutant: RustMutant) =>
  `${RUST_ROOT}/${mutant.file}:${mutant.line}:${mutant.column}  ${mutant.mutant}${mutant.occurrence > 0 ? ` (occurrence ${mutant.occurrence})` : ''}`;

// A missed mutant with no entry is unmatched; an entry whose mutant ran and was caught is stale (a test now kills it, or the code changed); an entry whose mutant is not in the full list is missing (its code is gone).
// eslint-disable-next-line local/no-unused-exports -- tests pin the matching apart from the cargo run
export const matchRustMutants = ({
  ledger,
  listed,
  outcomes,
}: {
  ledger: RustLedgerEntry[];
  listed: RustMutant[];
  outcomes: RustOutcome[];
}) => {
  const entryKeys = new Set(ledger.map(entryKey));
  const listedKeys = new Set(listed.map(entryKey));
  const outcomeByKey = new Map(
    outcomes.map((outcome) => [entryKey(outcome), outcome]),
  );
  return {
    unmatched: outcomes.filter(
      (outcome) =>
        outcome.status === 'missed' && !entryKeys.has(entryKey(outcome)),
    ),
    stale: ledger.filter((entry) => {
      return outcomeByKey.get(entryKey(entry))?.status === 'caught';
    }),
    missing: ledger.filter((entry) => !listedKeys.has(entryKey(entry))),
  };
};

// The message to fail with when `cargo mutants --version` did not exit 0 (null when a missing cargo ended it), or null when cargo-mutants runs.
// eslint-disable-next-line local/no-unused-exports -- tests pin the install message apart from the machine they run on
export const installFailure = (versionStatus: number | null) =>
  versionStatus === 0
    ? null
    : `cargo-mutants is not installed, and the mutation check of ${RUST_ROOT}/src/ needs it; install it with \`${INSTALL_COMMAND}\`.`;

// The failures that stop the gate, one message each; none means it passes. Only an exit status of 0 or 2 says which mutants were missed, so any other status fails on its own.
// eslint-disable-next-line local/no-unused-exports -- tests pin which exit statuses fail the gate apart from the cargo run
export const rustFailures = ({
  status,
  match,
}: {
  status: number | null;
  match: ReturnType<typeof matchRustMutants> | null;
}) => {
  if (status !== 0 && status !== 2)
    return [
      `cargo mutants exited with ${status ?? 'a signal'}${status !== null && status in FAILURE_EXIT_CODES ? `: ${FAILURE_EXIT_CODES[status]}` : ''}.`,
    ];
  if (match === null) return [];
  return [
    ...(match.unmatched.length > 0
      ? [
          `${match.unmatched.length} Rust mutant(s) were missed; the tests pass with this logic changed. Add a test that fails on each, or, for a mutant no test can observe, accept it with --accept "<reason>":\n  ${match.unmatched.map(describeMutant).join('\n  ')}`,
        ]
      : []),
    ...(match.stale.length > 0
      ? [
          `${match.stale.length} entr(y/ies) in scripts/mutation-accepted-rust.json accept a mutant that no longer survives; a test now kills it or the code changed, so remove each:\n  ${match.stale.map(describeEntry).join('\n  ')}`,
        ]
      : []),
    ...(match.missing.length > 0
      ? [
          `${match.missing.length} entr(y/ies) in scripts/mutation-accepted-rust.json name a mutant that no longer exists; remove each, and re-run with --accept "<reason>" if the code still has the mutant under another change:\n  ${match.missing.map(describeEntry).join('\n  ')}`,
        ]
      : []),
  ];
};

const git = (cwd: string, args: string[], okStatus = 0) => {
  const result = spawnSync('git', ['-c', 'core.quotePath=false', ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: MAX_COMMAND_OUTPUT_BYTES,
  });
  if (result.status !== okStatus)
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
};

// The diff `cargo mutants --in-diff` reads: the Rust files' changes against `base` (committed, staged and unstaged) and each untracked Rust file as an added file, every path relative to app/src-tauri/, which is where cargo-mutants roots a diff's paths. Its new side is the working tree, which is the tree cargo-mutants copies.
// eslint-disable-next-line local/no-unused-exports -- tests run it against a throwaway git repository
export const rustDiff = ({
  repositoryRoot,
  base,
}: {
  repositoryRoot: string;
  base: string;
}) => {
  const cwd = path.join(repositoryRoot, RUST_ROOT);
  const tracked = git(cwd, [
    'diff',
    '-M',
    '--relative',
    '--unified=0',
    '--no-color',
    '--no-ext-diff',
    '--diff-filter=d',
    base,
    '--',
    'src',
  ]);
  const untracked = git(cwd, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    'src',
  ])
    .split('\n')
    .filter((file) => file.endsWith('.rs'))
    // `git diff --no-index` exits 1 when the files differ, which an added file always does.
    .map((file) =>
      git(
        cwd,
        [
          'diff',
          '--no-index',
          '--unified=0',
          '--no-color',
          '--',
          '/dev/null',
          file,
        ],
        1,
      ),
    );
  return [tracked, ...untracked].join('');
};

// Runs cargo-mutants for the diff against `base` (every mutant when `base` is null), prints its progress, and returns the failures that stop the gate and the entries `acceptReason` adds for the missed mutants that have none.
export const runRustMutation = ({
  repositoryRoot,
  base,
  ledger,
  acceptReason,
}: {
  repositoryRoot: string;
  base: string | null;
  ledger: RustLedgerEntry[];
  acceptReason: string | null;
}) => {
  const rustRoot = path.join(repositoryRoot, RUST_ROOT);
  const missing = installFailure(
    spawnSync('cargo', ['mutants', '--version'], { cwd: rustRoot }).status,
  );
  if (missing !== null)
    return { failures: [missing], newEntries: [] as RustLedgerEntry[] };
  const listed = parseListedMutants(
    execFileSync('cargo', ['mutants', '--list', '--json'], {
      cwd: rustRoot,
      encoding: 'utf8',
      maxBuffer: MAX_COMMAND_OUTPUT_BYTES,
    }),
  );
  const scratch = mkdtempSync(path.join(tmpdir(), 'mutation-check-rust-'));
  try {
    const diffFile = path.join(scratch, 'changes.diff');
    if (base !== null)
      writeFileSync(diffFile, rustDiff({ repositoryRoot, base }));
    const status = spawnSync(
      'cargo',
      ['mutants', ...(base === null ? [] : ['--in-diff', diffFile])],
      { cwd: rustRoot, stdio: 'inherit' },
    ).status;
    const outcomesFile = path.join(rustRoot, 'mutants.out', 'outcomes.json');
    const outcomes =
      (status === 0 || status === 2) && existsSync(outcomesFile)
        ? parseOutcomes(readFileSync(outcomesFile, 'utf8'), listed)
        : [];
    const match = matchRustMutants({ ledger, listed, outcomes });
    const newEntries =
      acceptReason === null
        ? []
        : match.unmatched.map(({ file, mutant, occurrence }) => ({
            file,
            mutant,
            occurrence,
            reason: acceptReason,
          }));
    const judged = {
      ...match,
      unmatched: acceptReason === null ? match.unmatched : [],
    };
    return {
      failures: rustFailures({
        status,
        match: status === 0 || status === 2 ? judged : null,
      }),
      newEntries,
    };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
};
