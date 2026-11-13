// Mutation-tests only the lines of production files under app/ (the data-carrying layers: `db/`, `domain/`, `services/`, `platform/`, `util/` and the `.ts` files under `src/`; no `.tsx` file, ESLint rule or dev data server file) that the current branch added or changed against main (committed, staged, unstaged and untracked), together with, in each file it changed, the span of every entry of scripts/mutation-accepted.json and scripts/mutation-hangs.json, using app/stryker.config.json. `--all` mutates every production file under app/ with its own test as a whole instead, for an audit of code no branch changed; which files are production sources and which of their lines run is scripts/mutation-check-selection.ts.
// The Rust lines the branch changed under app/src-tauri/src/ (every Rust mutant with `--all`) are mutated by `cargo mutants` first (scripts/mutation-check-rust.ts), the networking glue left out (app/src-tauri/.cargo/mutants.toml); a missed mutant with no entry in scripts/mutation-accepted-rust.json fails the run like a TypeScript survivor, and `--accept` or `--accept-from` writes the reason into that ledger; a timed-out one with no entry in scripts/mutation-hangs-rust.json fails it like a TypeScript timeout, `--accept-hang` or `--accept-hang-from` writes into that ledger, and `--timeout-ms` sets cargo-mutants' test timeout. A branch that changes no Rust runs no cargo command, and Rust is skipped when file arguments are given.
// A file moved with git (`git mv`, staged or committed) counts only the lines changed after the move (scripts/mutation-check-diff.ts); a moved file git has not seen yet is untracked, and so new as a whole.
// Each mutant runs the Vitest tests related to its file through Stryker's command runner (scripts/mutation-check-related.ts): Stryker's Vitest runner 10.0.0 runs no test per mutant under Vitest 5, so it reports every mutant as surviving.
// Only files with their own test file (`<dir>/__tests__/<name>.test.ts(x)`) are mutated; the others are listed as skipped.
// With file arguments (`pnpm run mutation-check -- <file>…`, repository-root- or app-relative), only those files are mutated, among the changed ones or, with `--all`, among all production sources, so a fix loop re-runs the files that had survivors; a run without arguments is the gate. Before anything runs, it prints for each given file whether it mutates it or, if not, why: no such file, not a production source, not changed against main (`--all` mutates it as a whole), or no own test file. A given file of any of the first three kinds exits 2 before anything is mutated, listing the files a run would mutate; one without its own test file is skipped. `--accept "<reason>"`, `--accept-hang "<reason>"` and their file forms `--accept-from <file>` and `--accept-hang-from <file>`, with or without files, are described below.
// Exits non-zero when a mutant survives in one of them and scripts/mutation-accepted.json holds no entry for it: a test that passes with its target logic mutated catches no regression there.
// A survivor no test can kill (an equivalent mutant) is accepted by an entry of that ledger, which names one mutant by its file, mutator, replacement and the text of the line it starts on (scripts/mutation-check-ledger.ts); a survivor matches one entry, so each of two identical mutants needs its own.
// An accepted mutant still runs: an entry whose whole span this run mutated and whose mutant did not survive fails the run as stale, because a test now kills it or the code changed; remove it. Since every entry in a file the branch changed is mutated, a change on any line of that file that makes an entry's mutant killable, or another mutant on its lines observable, fails the run; only an entry in a file the branch did not change waits for an `--all` audit. On every run, before Stryker starts, an entry whose file or line no longer exists fails the run too, and so does a `Stryker disable` or `Stryker restore` comment anywhere under app/ outside app/docs/ and Markdown files.
// A mutant Stryker reports as `Timeout` (its tests ran past `timeoutMS` in app/stryker.config.json) fails the run too, listed apart from survivors, unless scripts/mutation-hangs.json holds an entry for it; that ledger has the entry shape and the stale and missing checks of scripts/mutation-accepted.json. A timeout counts as caught only when the mutant hangs, turning a loop's condition or update into one that never ends, since a test run observes a hang; `--accept-hang "<reason>"` records every unmatched timeout with that reason, so run it only once each one left is a confirmed hang; `--accept-hang-from <file>` gives each its own reason, as `--accept-from` below does for survivors. Any other timeout is re-run with a longer limit, `--timeout-ms <n>`, which overrides `timeoutMS` for one run, and is resolved by that run's result.
// `--accept "<reason>"` adds an entry with that reason for every survivor no entry matches, and prints each; run once without it first, and run it last, once every survivor still unmatched is known to be equivalent, since it accepts them all. Each entry it adds carries the one reason given, so where the mutants differ, edit each entry's reason in the ledger afterwards. Before Stryker starts, it runs the `test` row (`npx vitest run` in app/) and exits non-zero without writing an entry when a test fails (scripts/mutation-check-test-row.ts). `--accept` and `--accept-hang` first format app/ with Prettier (`pnpm run prettier-fix`), so each entry records its line as formatted and a later format run leaves it matching. After editing an accepted line by hand, remove its entry and re-run with `--accept`.
// `--accept-from <file>` (relative to the repository root, or absolute) is `--accept` with a reason per mutant, and excludes it; `--accept-hang-from <file>` is the same for `--accept-hang`, and excludes that. The file is a JSON object from each mutant's key to the one-line reason its entry records. A TypeScript mutant's key is the text the run prints for it before `on "`, such as `"app/util/a.ts:12:5  ConditionalExpression  → true"`; a Rust one's is the whole line the run prints for it, such as `"app/src-tauri/src/lib.rs:10:5  replace run with () (occurrence 1)"`; whitespace in a key need not match. One file covers both languages, so `--accept-from` takes the TypeScript survivors and the missed Rust mutants, and `--accept-hang-from` the timeouts of both. A mutant with no key in the file, or a key that names no mutant of the run, fails the run with no entry written to any ledger, the Rust ones included; since Prettier runs first and can move a line, take the keys from a run after the code is formatted, and since a run with file arguments mutates no Rust, a Rust key fails such a run. Two identical TypeScript survivors share a key and its reason.
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assignReasons,
  describeEntry,
  describeMutant,
  entryFor,
  entrySpan,
  findMissingEntries,
  matchLedger,
  mutantKey,
  mutantsOf,
  parseArguments,
  parseLedger,
  parseReasonFile,
  serializeLedger,
  unusedKeys,
  type MutatedRanges,
  type MutationReport,
  type ReasonSource,
  type SourceLines,
} from './mutation-check-ledger.ts';
import { changedLinesAgainst } from './mutation-check-diff.ts';
import {
  lineRangesFor,
  scopeOfRequestedFiles,
  selectFiles,
  testFileCandidates,
} from './mutation-check-selection.ts';
import {
  parseRustLedger,
  rustSourcePaths,
  runRustMutation,
  serializeRustLedger,
} from './mutation-check-rust.ts';
import { testRowFailure } from './mutation-check-test-row.ts';

const DEFAULT_BRANCH = 'main';
const REPORT_PATH = 'reports/mutation/mutation.json';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const appRoot = path.join(repositoryRoot, 'app');
const LEDGER_PATH = path.join(
  repositoryRoot,
  'scripts',
  'mutation-accepted.json',
);
const HANG_LEDGER_PATH = path.join(
  repositoryRoot,
  'scripts',
  'mutation-hangs.json',
);

let parsedArguments: ReturnType<typeof parseArguments>;
try {
  parsedArguments = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(`mutation-check: ${(error as Error).message}`);
  process.exit(2);
}
const {
  files: requestedFiles,
  all,
  acceptReason,
  hangReason,
  acceptFile,
  hangFile,
  timeoutMS,
} = parsedArguments;
const accepting = acceptReason !== null || acceptFile !== null;

// Read before anything runs, so a malformed file fails the run before Prettier, Vitest and Stryker take their time.
const reasonSource = (
  reason: string | null,
  reasonFile: string | null,
): ReasonSource => {
  if (reasonFile === null) return reason;
  try {
    return parseReasonFile(
      readFileSync(path.resolve(repositoryRoot, reasonFile), 'utf8'),
    );
  } catch (error) {
    console.error(
      `mutation-check: cannot read the reasons in ${reasonFile}: ${(error as Error).message}`,
    );
    process.exit(2);
  }
};
const survivorReasons = reasonSource(acceptReason, acceptFile);
const hangReasons = reasonSource(hangReason, hangFile);

// An entry keys its mutant by the text of its line, so a later Prettier run that rewrites that line would leave the entry naming a line that no longer exists; formatting first records the line as it will stay. Runs before any source line is read, since it can move lines.
if (survivorReasons !== null || hangReasons !== null) {
  const format = spawnSync(
    'pnpm',
    ['run', 'prettier-fix', '--log-level', 'warn'],
    {
      cwd: repositoryRoot,
      stdio: 'inherit',
    },
  );
  if (format.status !== 0) {
    console.error(
      `mutation-check: formatting app/ before writing ledger entries failed with ${format.status ?? format.signal}; no entry was written.`,
    );
    process.exit(2);
  }
}

const RUST_LEDGER_PATH = path.join(
  repositoryRoot,
  'scripts',
  'mutation-accepted-rust.json',
);
const RUST_HANG_LEDGER_PATH = path.join(
  repositoryRoot,
  'scripts',
  'mutation-hangs-rust.json',
);

const readRustLedger = (ledgerPath: string) => {
  try {
    return parseRustLedger(readFileSync(ledgerPath, 'utf8'));
  } catch (error) {
    console.error(
      `mutation-check: cannot read ${path.relative(repositoryRoot, ledgerPath)}: ${(error as Error).message}`,
    );
    process.exit(2);
  }
};
const rustLedger = readRustLedger(RUST_LEDGER_PATH);
const rustHangLedger = readRustLedger(RUST_HANG_LEDGER_PATH);

const readLedger = (ledgerPath: string) => {
  try {
    return parseLedger(readFileSync(ledgerPath, 'utf8'));
  } catch (error) {
    console.error(
      `mutation-check: cannot read ${path.relative(repositoryRoot, ledgerPath)}: ${(error as Error).message}`,
    );
    process.exit(2);
  }
};
const ledger = readLedger(LEDGER_PATH);
const hangLedger = readLedger(HANG_LEDGER_PATH);

const sourceCache = new Map<string, string[] | null>();
const sourceLines: SourceLines = (file) => {
  if (!sourceCache.has(file)) {
    const absolutePath = path.join(appRoot, file);
    sourceCache.set(
      file,
      existsSync(absolutePath)
        ? readFileSync(absolutePath, 'utf8').split('\n')
        : null,
    );
  }
  return sourceCache.get(file) ?? null;
};

const missingEntries = findMissingEntries(ledger, sourceLines);
if (missingEntries.length > 0) {
  console.error(
    `mutation-check: FAILED — ${missingEntries.length} ledger entr(y/ies) in scripts/mutation-accepted.json name a file or line that no longer exists; remove each, and re-run with --accept "<reason>" if its mutant still survives:\n  ${missingEntries.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
const missingHangEntries = findMissingEntries(hangLedger, sourceLines);
if (missingHangEntries.length > 0) {
  console.error(
    `mutation-check: FAILED — ${missingHangEntries.length} ledger entr(y/ies) in scripts/mutation-hangs.json name a file or line that no longer exists; remove each, and re-run with --accept-hang "<reason>" if its mutant still hangs:\n  ${missingHangEntries.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
if (missingEntries.length > 0 || missingHangEntries.length > 0) process.exit(1);

// Stryker honours a directive comment on its own, so a re-added one would hide mutants from this check.
const directiveScan = spawnSync(
  'git',
  [
    'grep',
    '-n',
    '--untracked',
    '-E',
    'Stryker (disable|restore)',
    '--',
    'app',
    ':!app/docs',
    ':!*.md',
  ],
  { cwd: repositoryRoot, encoding: 'utf8' },
);
if (directiveScan.status === 0) {
  console.error(
    `mutation-check: FAILED — a Stryker directive comment under app/ hides mutants from this check; remove it, and accept an equivalent mutant with --accept "<reason>" instead:\n  ${directiveScan.stdout.trim().split('\n').join('\n  ')}`,
  );
  process.exit(1);
}
if (directiveScan.status !== 1) {
  console.error(
    `mutation-check: the scan for Stryker directive comments failed:\n${directiveScan.stderr}`,
  );
  process.exit(2);
}

const git = (...args: string[]) =>
  execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' });
const lines = (output: string) => output.split('\n').filter(Boolean);

// A checkout without a local main branch, such as a CI clone, still has the remote-tracking one.
const baseBranch =
  lines(git('branch', '--list', DEFAULT_BRANCH)).length > 0
    ? DEFAULT_BRANCH
    : `origin/${DEFAULT_BRANCH}`;
const untrackedPaths = new Set(
  lines(git('ls-files', '--others', '--exclude-standard')),
);
// The lines the branch added or changed in each file, so a survivor in logic the branch did not write never fails it; an untracked file is new as a whole. With `all` every file is mutated as a whole and no diff is read.
const mergeBase = all ? null : git('merge-base', baseBranch, 'HEAD').trim();
const changedLines =
  mergeBase === null
    ? new Map<string, { start: number; end: number }[]>()
    : changedLinesAgainst({
        cwd: repositoryRoot,
        base: mergeBase,
        paths: ['app'],
      });
const appRelativePaths = (repositoryPaths: Iterable<string>) =>
  [...repositoryPaths]
    .filter((repositoryPath) => repositoryPath.startsWith('app/'))
    .map((repositoryPath) => repositoryPath.slice('app/'.length));

const { candidates, selected: selectedFiles } = selectFiles({
  all,
  listChangedPaths: () =>
    appRelativePaths([...changedLines.keys(), ...untrackedPaths]),
  listTrackedPaths: () =>
    appRelativePaths(
      lines(
        git('ls-files', '--cached', '--others', '--exclude-standard', 'app'),
      ),
    ),
  requestedFiles,
});
const scope = all
  ? 'production source under app/'
  : `changed production source under app/ against ${baseBranch}`;

const hasOwnTestFile = (appRelativePath: string) =>
  testFileCandidates(appRelativePath).some((candidate) =>
    existsSync(path.join(appRoot, candidate)),
  );

// Given files: which of them this run mutates, and why each other one is not, so a fix loop learns its scope before anything runs.
if (requestedFiles.length > 0) {
  const requestedScope = scopeOfRequestedFiles({
    all,
    baseBranch,
    candidates,
    requestedFiles,
    exists: (file) => existsSync(path.join(appRoot, file)),
    hasOwnTestFile,
  });
  console.log(
    `mutation-check: of the ${requestedFiles.length} given file(s):\n  ${requestedScope.map(({ file, status, reason }) => (status === 'mutated' ? `mutates  ${file}` : `skips    ${file} — ${reason}`)).join('\n  ')}`,
  );
  const outOfScope = requestedScope.filter(
    ({ status }) => status === 'outOfScope',
  );
  if (outOfScope.length > 0) {
    const mutable = candidates.filter(hasOwnTestFile);
    console.error(
      `mutation-check: ${outOfScope.length} given file(s) are no ${scope}; give only files this run mutates, or none. The ${scope} with its own test file, which a run mutates:${mutable.length === 0 ? ' none' : `\n  ${mutable.join('\n  ')}`}`,
    );
    process.exit(2);
  }
}

// The Rust lines the branch changed (every Rust mutant with `all`) are mutated by cargo-mutants before anything else can end the run; a per-file re-run is the TypeScript fix loop, so Rust waits for a run without files. Its new entries are written with the TypeScript ones, once every mutant a file of reasons covers has its reason.
let rust: ReturnType<typeof runRustMutation> | null = null;
const rustChanged = rustSourcePaths([
  ...changedLines.keys(),
  ...untrackedPaths,
]);
if (requestedFiles.length > 0) {
  console.log(
    '\nmutation-check: Rust is not mutated when files are given; a run without files covers it.',
  );
} else if (all || rustChanged.length > 0) {
  console.log(
    `\nmutation-check: cargo mutants over ${all ? 'all of app/src-tauri/src/' : `${rustChanged.length} changed Rust file(s)`}`,
  );
  rust = runRustMutation({
    repositoryRoot,
    base: mergeBase,
    ledger: rustLedger,
    hangLedger: rustHangLedger,
    acceptReason: survivorReasons,
    hangReason: hangReasons,
    timeoutMS,
  });
  for (const failure of rust.failures)
    console.error(`\nmutation-check: FAILED — ${failure}`);
}

if (candidates.length === 0) {
  console.log(
    `mutation-check: no production source under app/${all ? '' : ` changed against ${baseBranch}`}; nothing to mutate.`,
  );
}

const testedFiles = selectedFiles.filter(hasOwnTestFile);
const untestedFiles = selectedFiles.filter((file) => !hasOwnTestFile(file));

if (untestedFiles.length > 0) {
  console.log(
    `mutation-check: skipping ${untestedFiles.length} ${all ? '' : 'changed '}file(s) without their own test file:\n  ${untestedFiles.join('\n  ')}`,
  );
}

// One Stryker run for all files: its sandbox, processes and initial test run are paid once, and the command in app/stryker.config.json (scripts/mutation-check-related.ts) runs for each mutant only the tests related to the mutant's own file.
const mutatedRanges: MutatedRanges = new Map();
const ledgerSpans = (file: string) =>
  [...ledger, ...hangLedger]
    .filter((entry) => entry.file === file)
    .map((entry) => entrySpan(entry, sourceLines))
    .filter((span) => span !== null);
const mutateEntries = testedFiles.flatMap((file) => {
  const ranges = lineRangesFor({
    all,
    appRelativePath: file,
    untrackedPaths,
    changedLines,
    ledgerSpans,
  });
  const fileEntries =
    ranges === 'all'
      ? [file]
      : ranges.map(({ start, end }) => `${file}:${start}-${end}`);
  console.log(
    `\nmutation-check: ${fileEntries.join(', ') || `${file} (no line added or changed)`}`,
  );
  if (fileEntries.length > 0) mutatedRanges.set(file, ranges);
  return fileEntries;
});

// One Stryker run in app/ over the given `--mutate` entries; exits the script when Stryker itself fails.
const runStryker = (runEntries: string[], runFiles: string[]) => {
  rmSync(path.join(appRoot, REPORT_PATH), { force: true });
  const stryker = spawnSync(
    'npx',
    [
      'stryker',
      'run',
      '--mutate',
      runEntries.join(','),
      ...(timeoutMS === null ? [] : ['--timeoutMS', String(timeoutMS)]),
    ],
    {
      cwd: appRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        MUTATION_CHECK_FILES: runFiles.join(','),
        MUTATION_CHECK_RUNNER: path.join(
          repositoryRoot,
          'scripts',
          'mutation-check-related.ts',
        ),
      },
    },
  );
  if (stryker.status !== 0) {
    console.error(
      `mutation-check: Stryker exited with ${stryker.status ?? stryker.signal}.`,
    );
    process.exit(stryker.status ?? 1);
  }
  return JSON.parse(
    readFileSync(path.join(appRoot, REPORT_PATH), 'utf8'),
  ) as MutationReport;
};

if (accepting && mutateEntries.length > 0) {
  const failure = testRowFailure(appRoot);
  if (failure !== null) {
    console.error(`\n${failure}`);
    process.exit(1);
  }
}

const report =
  mutateEntries.length > 0
    ? runStryker(mutateEntries, [...mutatedRanges.keys()])
    : null;
const judge = (
  entries: typeof ledger,
  status: Parameters<typeof mutantsOf>[1],
) =>
  matchLedger({
    entries,
    mutants: report === null ? [] : mutantsOf(report, status),
    sourceLines,
    mutatedRanges,
  });
const survivorMatch = judge(ledger, 'Survived');
const timeoutMatch = judge(hangLedger, 'Timeout');

// Pairs each unmatched mutant of one kind with its reason, the Rust ones paired by runRustMutation. With a file of reasons, a mutant of either language without one, or a key of the file that names none of them, fails the run before any ledger is written.
const reasonsOf = (
  match: ReturnType<typeof matchLedger>,
  source: ReasonSource,
  rustReasons: NonNullable<typeof rust>['accepted'] | null,
  {
    option,
    file,
    outcome,
  }: { option: string; file: string | null; outcome: string },
) => {
  const { assigned, missing, used } = assignReasons(
    match.unmatched,
    source,
    mutantKey,
  );
  if (source === null || typeof source === 'string')
    return { assigned, failed: false };
  const missingLines = [
    ...missing.map((mutant) => describeMutant(mutant, sourceLines)),
    ...(rustReasons?.missing ?? []),
  ];
  const unused = unusedKeys(source, used, rustReasons?.used ?? new Set());
  if (missingLines.length > 0)
    console.error(
      `\nmutation-check: FAILED — ${missingLines.length} ${outcome} have no reason in ${file}; add each under its key, the text before "on" or, for Rust, the whole line:\n  ${missingLines.join('\n  ')}`,
    );
  if (unused.length > 0)
    console.error(
      `\nmutation-check: FAILED — ${unused.length} key(s) in ${file} name none of the ${outcome} of this run; a test now kills it, the code changed, Prettier moved it, or this run did not mutate its file (Rust is mutated only by a run without files), so re-run without ${option} and take each key from the mutants it prints:\n  ${unused.join('\n  ')}`,
    );
  return { assigned, failed: missingLines.length > 0 || unused.length > 0 };
};
const survivorAssignment = reasonsOf(
  survivorMatch,
  survivorReasons,
  rust?.accepted ?? null,
  {
    option: '--accept-from',
    file: acceptFile,
    outcome: 'survivor(s) and missed Rust mutant(s)',
  },
);
const hangAssignment = reasonsOf(
  timeoutMatch,
  hangReasons,
  rust?.hangs ?? null,
  {
    option: '--accept-hang-from',
    file: hangFile,
    outcome: 'timed-out mutant(s)',
  },
);
if (survivorAssignment.failed || hangAssignment.failed) {
  console.error('mutation-check: no ledger entry was written.');
  process.exit(1);
}

// Each Rust ledger with the entries the reasons add to it; none without a Rust run.
const rustWrites =
  rust === null
    ? []
    : [
        {
          ledgerPath: RUST_LEDGER_PATH,
          entries: rustLedger,
          added: rust.accepted.entries,
          recorded: 'missed Rust mutant(s)',
        },
        {
          ledgerPath: RUST_HANG_LEDGER_PATH,
          entries: rustHangLedger,
          added: rust.hangs.entries,
          recorded: 'confirmed Rust hang(s)',
        },
      ];
for (const { ledgerPath, entries, added, recorded } of rustWrites) {
  if (added.length === 0) continue;
  writeFileSync(ledgerPath, serializeRustLedger([...entries, ...added]));
  console.log(
    `\nmutation-check: recorded ${added.length} ${recorded} into ${path.relative(repositoryRoot, ledgerPath)}:\n  ${added.map((entry) => `app/src-tauri/${entry.file}  ${entry.mutant}  — ${entry.reason}`).join('\n  ')}`,
  );
}
const rustFailed = rust !== null && rust.failures.length > 0;

// Writes an entry with its reason for every mutant in `accepted`, and returns the mutants that still fail the run: none once they are written.
const recordUnmatched = ({
  match,
  entries,
  ledgerPath,
  accepted,
  recorded,
}: {
  match: ReturnType<typeof matchLedger>;
  entries: typeof ledger;
  ledgerPath: string;
  accepted:
    { mutant: (typeof match.unmatched)[number]; reason: string }[] | null;
  recorded: string;
}) => {
  if (accepted === null) return match.unmatched;
  if (accepted.length === 0) return [];
  const added = accepted.map(({ mutant, reason }) =>
    entryFor(mutant, sourceLines, reason),
  );
  writeFileSync(
    ledgerPath,
    serializeLedger([...entries, ...added], sourceLines),
  );
  console.log(
    `\nmutation-check: recorded ${added.length} ${recorded} into ${path.relative(repositoryRoot, ledgerPath)}:\n  ${added.map((entry) => `${describeEntry(entry, sourceLines)}  — ${entry.reason}`).join('\n  ')}`,
  );
  return [];
};
const unmatched = recordUnmatched({
  match: survivorMatch,
  entries: ledger,
  ledgerPath: LEDGER_PATH,
  accepted: survivorAssignment.assigned,
  recorded: 'survivor(s)',
});
const timedOut = recordUnmatched({
  match: timeoutMatch,
  entries: hangLedger,
  ledgerPath: HANG_LEDGER_PATH,
  accepted: hangAssignment.assigned,
  recorded: 'confirmed hang(s)',
});
const stale = survivorMatch.stale;
const staleHangs = timeoutMatch.stale;

if (unmatched.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${unmatched.length} mutant(s) survived in files with their own tests; the tests pass with this logic changed. Add a test that fails on each, or, for a mutant no test can observe, accept it with --accept "<reason>", or with --accept-from <file> for a reason per survivor:\n  ${unmatched.map((mutant) => describeMutant(mutant, sourceLines)).join('\n  ')}`,
  );
}
if (timedOut.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${timedOut.length} mutant(s) timed out, so the run cannot tell whether a test catches them. Where the mutant turns a loop into one that never ends, the hang is caught: record it with --accept-hang "<which loop the mutant makes endless>", or with --accept-hang-from <file> for a reason per mutant; re-run any other with a longer limit, --timeout-ms <n> (app/stryker.config.json sets timeoutMS), and resolve it by that result:\n  ${timedOut.map((mutant) => describeMutant(mutant, sourceLines)).join('\n  ')}`,
  );
}
if (stale.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${stale.length} ledger entr(y/ies) in scripts/mutation-accepted.json accept a mutant that no longer survives; a test now kills it or the code changed, so remove each:\n  ${stale.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
if (staleHangs.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${staleHangs.length} ledger entr(y/ies) in scripts/mutation-hangs.json record a hang whose mutant no longer times out; a test now kills it or the code changed, so remove each:\n  ${staleHangs.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
if (
  unmatched.length > 0 ||
  timedOut.length > 0 ||
  stale.length > 0 ||
  staleHangs.length > 0 ||
  rustFailed
)
  process.exit(1);
if (candidates.length > 0)
  console.log(
    `\nmutation-check: passed — in the ${testedFiles.length} ${all ? '' : 'changed '}file(s) with their own tests, every mutant that survived is accepted in scripts/mutation-accepted.json and every one that timed out is a hang recorded in scripts/mutation-hangs.json, and every entry of either whose line this run mutated still has that outcome.`,
  );
