// Mutation-tests only the lines of production files under app/ that the current branch added or changed against main (committed, staged, unstaged and untracked), using app/stryker.config.json. `--all` mutates every production file under app/ with its own test as a whole instead, for an audit of code no branch changed; which files are production sources and which of their lines run is scripts/mutation-check-selection.ts.
// The Rust lines the branch changed under app/src-tauri/src/ (every Rust mutant with `--all`) are mutated by `cargo mutants` first (scripts/mutation-check-rust.ts), the networking glue left out (app/src-tauri/.cargo/mutants.toml); a missed mutant with no entry in scripts/mutation-accepted-rust.json fails the run like a TypeScript survivor, and `--accept` writes the reason into that ledger. A branch that changes no Rust runs no cargo command, and Rust is skipped when file arguments are given.
// A file moved with git (`git mv`, staged or committed) counts only the lines changed after the move (scripts/mutation-check-diff.ts); a moved file git has not seen yet is untracked, and so new as a whole.
// Each mutant runs the Vitest tests related to its file through Stryker's command runner (scripts/mutation-check-related.ts): Stryker's Vitest runner 10.0.0 runs no test per mutant under Vitest 5, so it reports every mutant as surviving.
// Only files with their own test file (`<dir>/__tests__/<name>.test.ts(x)`, `.test.js` for `eslint-rules/`) are mutated; the others are listed as skipped.
// With file arguments (`pnpm run mutation-check -- <file>…`, repository-root- or app-relative), only those files are mutated, among the changed ones or, with `--all`, among all production sources, so a fix loop re-runs the files that had survivors; a run without arguments is the gate. `--accept "<reason>"`, with or without files, is described below.
// Exits non-zero when a mutant survives in one of them and scripts/mutation-accepted.json holds no entry for it: a test that passes with its target logic mutated catches no regression there.
// A survivor no test can kill (an equivalent mutant) is accepted by an entry of that ledger, which names one mutant by its file, mutator, replacement and the text of the line it starts on (scripts/mutation-check-ledger.ts); a survivor matches one entry, so each of two identical mutants needs its own.
// An accepted mutant still runs: an entry whose whole span this run mutated and whose mutant did not survive fails the run as stale, because a test now kills it or the code changed; remove it. On every run, before Stryker starts, an entry whose file or line no longer exists fails the run too, and so does a `Stryker disable` or `Stryker restore` comment anywhere under app/ outside app/docs/ and Markdown files.
// `--accept "<reason>"` adds an entry with that reason for every survivor no entry matches, and prints each; run once without it first, so only mutants known to be equivalent are accepted. Before Stryker starts, it runs the `test` row (`npx vitest run` in app/) and exits non-zero without writing an entry when a test fails (scripts/mutation-check-test-row.ts). After editing an accepted line, remove its entry and re-run with `--accept`.
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import {
  describeEntry,
  describeSurvivor,
  entryFor,
  findMissingEntries,
  matchSurvivors,
  parseArguments,
  parseLedger,
  serializeLedger,
  survivorsOf,
  type MutatedRanges,
  type MutationReport,
  type SourceLines,
} from './mutation-check-ledger.ts';
import { changedLinesAgainst } from './mutation-check-diff.ts';
import {
  lineRangesFor,
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

let parsedArguments: ReturnType<typeof parseArguments>;
try {
  parsedArguments = parseArguments(process.argv.slice(2));
} catch (error) {
  console.error(`mutation-check: ${(error as Error).message}`);
  process.exit(2);
}
const { files: requestedFiles, all, acceptReason } = parsedArguments;

const RUST_LEDGER_PATH = path.join(
  repositoryRoot,
  'scripts',
  'mutation-accepted-rust.json',
);

let rustLedger: ReturnType<typeof parseRustLedger>;
try {
  rustLedger = parseRustLedger(readFileSync(RUST_LEDGER_PATH, 'utf8'));
} catch (error) {
  console.error(
    `mutation-check: cannot read ${path.relative(repositoryRoot, RUST_LEDGER_PATH)}: ${(error as Error).message}`,
  );
  process.exit(2);
}

let ledger: ReturnType<typeof parseLedger>;
try {
  ledger = parseLedger(readFileSync(LEDGER_PATH, 'utf8'));
} catch (error) {
  console.error(
    `mutation-check: cannot read ${path.relative(repositoryRoot, LEDGER_PATH)}: ${(error as Error).message}`,
  );
  process.exit(2);
}

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
  process.exit(1);
}

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

const {
  candidates,
  selected: selectedFiles,
  unknown,
} = selectFiles({
  candidatePaths: all
    ? appRelativePaths(
        lines(
          git('ls-files', '--cached', '--others', '--exclude-standard', 'app'),
        ),
      )
    : appRelativePaths([...changedLines.keys(), ...untrackedPaths]),
  requestedFiles,
});
const scope = all
  ? 'production source under app/'
  : `changed production source under app/ against ${baseBranch}`;

// The Rust lines the branch changed (every Rust mutant with `all`) are mutated by cargo-mutants before anything else can end the run; a per-file re-run is the TypeScript fix loop, so Rust waits for a run without files.
let rustFailed = false;
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
  const rust = runRustMutation({
    repositoryRoot,
    base: mergeBase,
    ledger: rustLedger,
    acceptReason,
  });
  if (rust.newEntries.length > 0) {
    writeFileSync(
      RUST_LEDGER_PATH,
      serializeRustLedger([...rustLedger, ...rust.newEntries]),
    );
    console.log(
      `\nmutation-check: accepted ${rust.newEntries.length} Rust mutant(s) into scripts/mutation-accepted-rust.json with the reason "${acceptReason}".`,
    );
  }
  rustFailed = rust.failures.length > 0;
  for (const failure of rust.failures)
    console.error(`\nmutation-check: FAILED — ${failure}`);
}

if (candidates.length === 0) {
  console.log(
    `mutation-check: no production source under app/${all ? '' : ` changed against ${baseBranch}`}; nothing to mutate.`,
  );
  process.exit(rustFailed ? 1 : 0);
}

const hasOwnTestFile = (appRelativePath: string) =>
  testFileCandidates(appRelativePath).some((candidate) =>
    existsSync(path.join(appRoot, candidate)),
  );

if (unknown.length > 0) {
  console.error(`mutation-check: not a ${scope}:\n  ${unknown.join('\n  ')}`);
  process.exit(2);
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
const mutateEntries = testedFiles.flatMap((file) => {
  const ranges = lineRangesFor({
    all,
    appRelativePath: file,
    untrackedPaths,
    changedLines,
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
    ['stryker', 'run', '--mutate', runEntries.join(',')],
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

if (acceptReason !== null && mutateEntries.length > 0) {
  const failure = testRowFailure(appRoot);
  if (failure !== null) {
    console.error(`\n${failure}`);
    process.exit(1);
  }
}

const survivors =
  mutateEntries.length > 0
    ? survivorsOf(runStryker(mutateEntries, [...mutatedRanges.keys()]))
    : [];
const matched = matchSurvivors({
  entries: ledger,
  survivors,
  sourceLines,
  mutatedRanges,
});
const { stale } = matched;

if (acceptReason !== null && matched.unmatched.length > 0) {
  const accepted = matched.unmatched.map((survivor) =>
    entryFor(survivor, sourceLines, acceptReason),
  );
  writeFileSync(
    LEDGER_PATH,
    serializeLedger([...ledger, ...accepted], sourceLines),
  );
  console.log(
    `\nmutation-check: accepted ${accepted.length} survivor(s) into scripts/mutation-accepted.json with the reason "${acceptReason}":\n  ${accepted.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
const unmatched = acceptReason === null ? matched.unmatched : [];

if (unmatched.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${unmatched.length} mutant(s) survived in files with their own tests; the tests pass with this logic changed. Add a test that fails on each, or, for a mutant no test can observe, accept it with --accept "<reason>":\n  ${unmatched.map(describeSurvivor).join('\n  ')}`,
  );
}
if (stale.length > 0) {
  console.error(
    `\nmutation-check: FAILED — ${stale.length} ledger entr(y/ies) in scripts/mutation-accepted.json accept a mutant that no longer survives; a test now kills it or the code changed, so remove each:\n  ${stale.map((entry) => describeEntry(entry, sourceLines)).join('\n  ')}`,
  );
}
if (unmatched.length > 0 || stale.length > 0 || rustFailed) process.exit(1);
console.log(
  `\nmutation-check: passed — every mutant that survived in the ${testedFiles.length} ${all ? '' : 'changed '}file(s) with their own tests is accepted in scripts/mutation-accepted.json, and every entry whose line this run mutated still survives.`,
);
