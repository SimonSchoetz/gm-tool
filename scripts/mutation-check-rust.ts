// The Rust half of scripts/mutation-check.ts: `cargo mutants` over the Rust lines a branch added or changed under app/src-tauri/src/, or over all of them with `--all`, judged against scripts/mutation-accepted-rust.json for missed mutants and scripts/mutation-hangs-rust.json for timed-out ones.
// cargo-mutants is a machine tool (`cargo install --locked cargo-mutants`), not a project dependency; app/src-tauri/.cargo/mutants.toml leaves out the networking glue that app/src-tauri/CLAUDE.md — Testing exempts from unit tests.
// An entry of either ledger names one mutant by its file, its change (cargo-mutants' name without the `file:line:col: ` prefix) and `occurrence`, which counts the earlier mutants of that file with the same change, so a line shift never invalidates it.
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
import { assignReasons, type ReasonSource } from './mutation-check-ledger.ts';

const RUST_ROOT = 'app/src-tauri';
const RUST_SOURCE_PREFIX = `${RUST_ROOT}/src/`;
const INSTALL_COMMAND = 'cargo install --locked cargo-mutants';
const ACCEPTED_LEDGER = 'scripts/mutation-accepted-rust.json';
const HANG_LEDGER = 'scripts/mutation-hangs-rust.json';

// The exit codes after which mutants.out/outcomes.json says how each mutant ended: 0 (every mutant caught), 2 (some missed) and 3 (some timed out, which cargo-mutants returns ahead of 2), https://mutants.rs/exit-codes.html
const JUDGED_EXIT_CODES: readonly (number | null)[] = [0, 2, 3];

// cargo-mutants' other exit codes, https://mutants.rs/exit-codes.html
const FAILURE_EXIT_CODES: Record<number, string> = {
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
  status: 'caught' | 'missed' | 'timeout' | 'unviable';
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

// cargo-mutants' other summaries, `Success` and `Failure`, do not occur for a mutant that ran its tests, so reading one is an error.
const STATUS_OF_SUMMARY = new Map<string, RustOutcome['status']>([
  ['CaughtMutant', 'caught'],
  ['MissedMutant', 'missed'],
  ['Timeout', 'timeout'],
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

// Orders by UTF-16 code unit, as a string sort does: the order scripts/mutation-accepted-rust.json is committed in, with `save_image.rs` before `save_image_bytes.rs`, where `localeCompare` ranks `_` before `.` and would swap them on every write.
const compareText = (first: string, second: string) =>
  first < second ? -1 : first > second ? 1 : 0;

// Ordered by file, change and occurrence as two-space JSON with a final newline, so a rewrite changes only the entries that changed.
export const serializeRustLedger = (entries: RustLedgerEntry[]) =>
  `${JSON.stringify(
    [...entries]
      .sort(
        (first, second) =>
          compareText(first.file, second.file) ||
          compareText(first.mutant, second.mutant) ||
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

// Also the key of the mutant's reason in an `--accept-from` or `--accept-hang-from` file.
const describeMutant = (mutant: RustMutant) =>
  `${RUST_ROOT}/${mutant.file}:${mutant.line}:${mutant.column}  ${mutant.mutant}${mutant.occurrence > 0 ? ` (occurrence ${mutant.occurrence})` : ''}`;

// Matches one ledger against the outcomes of the mutants it records with `status` (`missed` for scripts/mutation-accepted-rust.json, `timeout` for scripts/mutation-hangs-rust.json). A mutant with that status and no entry is unmatched; an entry whose mutant ran and was caught, or ended with the other of the two statuses, is stale (a test now kills it, or the code changed); an entry whose mutant is not in the full list is missing (its code is gone). An unviable mutant leaves its entry neither unmatched nor stale.
// eslint-disable-next-line local/no-unused-exports -- tests pin the matching apart from the cargo run
export const matchRustMutants = ({
  ledger,
  listed,
  outcomes,
  status,
}: {
  ledger: RustLedgerEntry[];
  listed: RustMutant[];
  outcomes: RustOutcome[];
  status: 'missed' | 'timeout';
}) => {
  const entryKeys = new Set(ledger.map(entryKey));
  const listedKeys = new Set(listed.map(entryKey));
  const outcomeByKey = new Map(
    outcomes.map((outcome) => [entryKey(outcome), outcome]),
  );
  return {
    unmatched: outcomes.filter(
      (outcome) =>
        outcome.status === status && !entryKeys.has(entryKey(outcome)),
    ),
    stale: ledger.filter((entry) => {
      const ran = outcomeByKey.get(entryKey(entry))?.status ?? null;
      return ran !== null && ran !== status && ran !== 'unviable';
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

type RustMatch = ReturnType<typeof matchRustMutants>;

// The failures that stop the gate, one message each; none means it passes. Only an exit status of 0, 2 or 3 says how each mutant ended, so any other status fails on its own; `accepted` is the match of the missed mutants and `hangs` that of the timed-out ones.
// eslint-disable-next-line local/no-unused-exports -- tests pin which exit statuses fail the gate apart from the cargo run
export const rustFailures = ({
  status,
  accepted,
  hangs,
}: {
  status: number | null;
  accepted: RustMatch | null;
  hangs: RustMatch | null;
}) => {
  if (!JUDGED_EXIT_CODES.includes(status))
    return [
      `cargo mutants exited with ${status ?? 'a signal'}${status !== null && status in FAILURE_EXIT_CODES ? `: ${FAILURE_EXIT_CODES[status]}` : ''}.`,
    ];
  const failure = (message: string, lines: string[]) =>
    lines.length > 0
      ? [`${lines.length} ${message}:\n  ${lines.join('\n  ')}`]
      : [];
  const ledgerFailures = (
    match: RustMatch | null,
    {
      ledgerPath,
      acceptOption,
      staleRecord,
    }: { ledgerPath: string; acceptOption: string; staleRecord: string },
  ) =>
    match === null
      ? []
      : [
          ...failure(
            `entr(y/ies) in ${ledgerPath} ${staleRecord}; a test now kills it or the code changed, so remove each`,
            match.stale.map(describeEntry),
          ),
          ...failure(
            `entr(y/ies) in ${ledgerPath} name a mutant that no longer exists; remove each, and re-run with ${acceptOption} "<reason>" if the code still has the mutant under another change`,
            match.missing.map(describeEntry),
          ),
        ];
  return [
    ...failure(
      'Rust mutant(s) were missed; the tests pass with this logic changed. Add a test that fails on each, or, for a mutant no test can observe, accept it with --accept "<reason>", or with --accept-from <file> for a reason per mutant',
      (accepted?.unmatched ?? []).map(describeMutant),
    ),
    ...failure(
      `Rust mutant(s) timed out, so the run cannot tell whether a test catches them. Where the mutant turns a loop into one that never ends, the hang is caught: record it with --accept-hang "<which loop the mutant makes endless>", or with --accept-hang-from <file> for a reason per mutant; re-run any other with a longer limit, --timeout-ms <n>, which cargo-mutants receives as its test timeout (\`--timeout\`, in seconds) in place of the one it derives from the baseline test run, and resolve it by that result`,
      (hangs?.unmatched ?? []).map(describeMutant),
    ),
    ...ledgerFailures(accepted, {
      ledgerPath: ACCEPTED_LEDGER,
      acceptOption: '--accept',
      staleRecord: 'accept a mutant that no longer survives',
    }),
    ...ledgerFailures(hangs, {
      ledgerPath: HANG_LEDGER,
      acceptOption: '--accept-hang',
      staleRecord: 'record a hang whose mutant no longer times out',
    }),
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

// The arguments of the mutating `cargo mutants` run: the diff against the base when there is one, and `timeoutMS` as cargo-mutants' test timeout, which it takes in seconds.
const runArguments = (diffFile: string | null, timeoutMS: number | null) => [
  'mutants',
  ...(diffFile === null ? [] : ['--in-diff', diffFile]),
  ...(timeoutMS === null ? [] : ['--timeout', String(timeoutMS / 1000)]),
];

// The entries `source` gives the unmatched mutants of `match`, with the mutants a file of reasons has no reason for (described) and the keys of that file that named one.
const entriesFor = (match: RustMatch, source: ReasonSource) => {
  const { assigned, missing, used } = assignReasons(
    match.unmatched,
    source,
    describeMutant,
  );
  return {
    entries: (assigned ?? []).map(
      ({ mutant: { file, mutant, occurrence }, reason }) => ({
        file,
        mutant,
        occurrence,
        reason,
      }),
    ),
    missing: missing.map(describeMutant),
    used,
  };
};

const NO_REASONS = {
  entries: [] as RustLedgerEntry[],
  missing: [] as string[],
  used: new Set<string>(),
};

// Runs cargo-mutants for the diff against `base` (every mutant when `base` is null), prints its progress, and returns the failures that stop the gate and, for the missed mutants (`accepted`, from `acceptReason`) and the timed-out ones (`hangs`, from `hangReason`) that have no entry, the entries the reasons add, the mutants a file of reasons has no reason for, and the keys of that file that named one. A mutant given a reason, or left without one by a file, is no failure here: the caller fails a missing reason, together with the TypeScript ones, before writing any entry.
export const runRustMutation = ({
  repositoryRoot,
  base,
  ledger,
  hangLedger,
  acceptReason,
  hangReason,
  timeoutMS,
}: {
  repositoryRoot: string;
  base: string | null;
  ledger: RustLedgerEntry[];
  hangLedger: RustLedgerEntry[];
  acceptReason: ReasonSource;
  hangReason: ReasonSource;
  timeoutMS: number | null;
}) => {
  const rustRoot = path.join(repositoryRoot, RUST_ROOT);
  const missing = installFailure(
    spawnSync('cargo', ['mutants', '--version'], { cwd: rustRoot }).status,
  );
  if (missing !== null)
    return { failures: [missing], accepted: NO_REASONS, hangs: NO_REASONS };
  const listed = parseListedMutants(
    execFileSync('cargo', ['mutants', '--list', '--json'], {
      cwd: rustRoot,
      encoding: 'utf8',
      maxBuffer: MAX_COMMAND_OUTPUT_BYTES,
    }),
  );
  const scratch = mkdtempSync(path.join(tmpdir(), 'mutation-check-rust-'));
  try {
    let diffFile: string | null = null;
    if (base !== null) {
      diffFile = path.join(scratch, 'changes.diff');
      writeFileSync(diffFile, rustDiff({ repositoryRoot, base }));
    }
    const status = spawnSync('cargo', runArguments(diffFile, timeoutMS), {
      cwd: rustRoot,
      stdio: 'inherit',
    }).status;
    const judged = JUDGED_EXIT_CODES.includes(status);
    if (!judged)
      return {
        failures: rustFailures({ status, accepted: null, hangs: null }),
        accepted: NO_REASONS,
        hangs: NO_REASONS,
      };
    const outcomesFile = path.join(rustRoot, 'mutants.out', 'outcomes.json');
    const outcomes = existsSync(outcomesFile)
      ? parseOutcomes(readFileSync(outcomesFile, 'utf8'), listed)
      : [];
    const accepted = matchRustMutants({
      ledger,
      listed,
      outcomes,
      status: 'missed',
    });
    const hangs = matchRustMutants({
      ledger: hangLedger,
      listed,
      outcomes,
      status: 'timeout',
    });
    // A mutant an entry is written for, or one the caller fails for its missing reason, fails the run no more here.
    const withoutRecorded = (match: RustMatch, reason: ReasonSource) => ({
      ...match,
      unmatched: reason === null ? match.unmatched : [],
    });
    return {
      failures: rustFailures({
        status,
        accepted: withoutRecorded(accepted, acceptReason),
        hangs: withoutRecorded(hangs, hangReason),
      }),
      accepted: entriesFor(accepted, acceptReason),
      hangs: entriesFor(hangs, hangReason),
    };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
};
