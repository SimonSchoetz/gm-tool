// Mutation-tests only the lines of production files under app/ that the current branch added or changed against main (committed, staged, unstaged and untracked), using app/stryker.config.json.
// Each mutant runs the Vitest tests related to its file through Stryker's command runner (scripts/mutation-check-related.ts): Stryker's Vitest runner 10.0.0 runs no test per mutant under Vitest 5, so it reports every mutant as surviving.
// Only changed files with their own test file (`<dir>/__tests__/<name>.test.ts(x)`) are mutated; the others are listed as skipped.
// With file arguments (`pnpm run mutation-check -- <file>…`, repository-root- or app-relative), only those files are mutated, so a fix loop re-runs the files that had survivors; a run without arguments is the gate. `--accept "<reason>"`, with or without files, is described below.
// Exits non-zero when a mutant survives in one of them and scripts/mutation-accepted.json holds no entry for it: a test that passes with its target logic mutated catches no regression there.
// A survivor no test can kill (an equivalent mutant) is accepted by an entry of that ledger, which names one mutant by its file, mutator, replacement and the text of the line it starts on (scripts/mutation-check-ledger.ts); a survivor matches one entry, so each of two identical mutants needs its own.
// An accepted mutant still runs: an entry whose whole span this run mutated and whose mutant did not survive fails the run as stale, because a test now kills it or the code changed; remove it. On every run, before Stryker starts, an entry whose file or line no longer exists fails the run too, and so does a `Stryker disable` or `Stryker restore` comment anywhere under app/ outside app/docs/ and Markdown files.
// `--accept "<reason>"` adds an entry with that reason for every survivor no entry matches, and prints each; run once without it first, so only mutants known to be equivalent are accepted. After editing an accepted line, remove its entry and re-run with `--accept`.
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

const DEFAULT_BRANCH = 'main';
const PRODUCTION_DIRECTORIES = [
  'src',
  'services',
  'domain',
  'db',
  'dev-data-server',
  'platform',
  'util',
];
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
const { files: requestedFiles, acceptReason } = parsedArguments;

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
const mergeBase = git('merge-base', baseBranch, 'HEAD').trim();

const untrackedPaths = new Set(
  lines(git('ls-files', '--others', '--exclude-standard')),
);
const changedPaths = new Set([
  ...lines(git('diff', '--name-only', '--diff-filter=d', mergeBase)),
  ...untrackedPaths,
]);

// The lines the branch added or changed in a file, so a survivor in logic the branch did not write never fails it; an untracked file is new as a whole.
const changedLineRanges = (appRelativePath: string) => {
  if (untrackedPaths.has(`app/${appRelativePath}`)) return 'all' as const;
  return lines(
    git('diff', '--unified=0', mergeBase, '--', `app/${appRelativePath}`),
  )
    .map((line) => /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line))
    .filter((hunk) => hunk !== null)
    .map(([, start, count = '1']) => [Number(start), Number(count)])
    .filter(([, count]) => count > 0)
    .map(([start, count]) => ({ start, end: start + count - 1 }));
};

const isProductionSource = (appRelativePath: string) =>
  PRODUCTION_DIRECTORIES.some((directory) =>
    appRelativePath.startsWith(`${directory}/`),
  ) &&
  /\.tsx?$/.test(appRelativePath) &&
  !appRelativePath.endsWith('.d.ts') &&
  !appRelativePath.includes('__tests__/') &&
  appRelativePath !== 'src/routeTree.gen.ts';

const filesToMutate = [...changedPaths]
  .filter((repositoryPath) => repositoryPath.startsWith('app/'))
  .map((repositoryPath) => repositoryPath.slice('app/'.length))
  .filter(isProductionSource)
  .sort();

if (filesToMutate.length === 0) {
  console.log(
    `mutation-check: no production source under app/ changed against ${baseBranch}; nothing to mutate.`,
  );
  process.exit(0);
}

const hasOwnTestFile = (appRelativePath: string) => {
  const { dir, name } = path.parse(appRelativePath);
  return ['.test.ts', '.test.tsx'].some((suffix) =>
    existsSync(path.join(appRoot, dir, '__tests__', `${name}${suffix}`)),
  );
};

const unknownRequestedFiles = requestedFiles.filter(
  (file) => !filesToMutate.includes(file),
);
if (unknownRequestedFiles.length > 0) {
  console.error(
    `mutation-check: not a changed production source under app/ against ${baseBranch}:\n  ${unknownRequestedFiles.join('\n  ')}`,
  );
  process.exit(2);
}
const selectedFiles =
  requestedFiles.length > 0
    ? filesToMutate.filter((file) => requestedFiles.includes(file))
    : filesToMutate;

const testedFiles = selectedFiles.filter(hasOwnTestFile);
const untestedFiles = selectedFiles.filter((file) => !hasOwnTestFile(file));

if (untestedFiles.length > 0) {
  console.log(
    `mutation-check: skipping ${untestedFiles.length} changed file(s) without their own test file:\n  ${untestedFiles.join('\n  ')}`,
  );
}

// One Stryker run for all files: its sandbox, processes and initial test run are paid once, and the command in app/stryker.config.json (scripts/mutation-check-related.ts) runs for each mutant only the tests related to the mutant's own file.
const mutatedRanges: MutatedRanges = new Map();
const mutateEntries = testedFiles.flatMap((file) => {
  const ranges = changedLineRanges(file);
  const fileEntries =
    ranges === 'all'
      ? [file]
      : ranges.map(({ start, end }) => `${file}:${start}-${end}`);
  console.log(
    `\nmutation-check: ${fileEntries.join(', ') || `${file} (lines removed only)`}`,
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
if (unmatched.length > 0 || stale.length > 0) process.exit(1);
console.log(
  `\nmutation-check: passed — every mutant that survived in the ${testedFiles.length} changed file(s) with their own tests is accepted in scripts/mutation-accepted.json, and every entry whose line this run mutated still survives.`,
);
