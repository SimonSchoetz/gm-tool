// Which files under app/ scripts/mutation-check.ts mutates, and which of their lines.
// Pure: the script passes in how to list the changed and the tracked paths, and checks which candidate test files exist. Every path is relative to app/.
import path from 'path';
import type { MutatedRanges } from './mutation-check-ledger.ts';

// The layers whose logic carries the app's data. Left out: the ESLint rules and the dev data server (development tooling, whose defects show while developing), and under `src/` every `.tsx` file (components, screens, providers and routes), whose surviving mutants are almost all presentation no test may read.
const PRODUCTION_DIRECTORIES = [
  'src',
  'services',
  'domain',
  'db',
  'platform',
  'util',
];

type FileRanges = NonNullable<ReturnType<MutatedRanges['get']>>;

// eslint-disable-next-line local/no-unused-exports -- tests pin which paths are production sources, apart from the selection that uses it
export const isProductionSource = (appRelativePath: string) =>
  PRODUCTION_DIRECTORIES.some((directory) =>
    appRelativePath.startsWith(`${directory}/`),
  ) &&
  path.extname(appRelativePath) === '.ts' &&
  !appRelativePath.endsWith('.d.ts') &&
  !appRelativePath.includes('__tests__/') &&
  appRelativePath !== 'src/routeTree.gen.ts';

// The paths a source's own test file can have; the source has one when any of them exists.
export const testFileCandidates = (appRelativePath: string) => {
  const { dir, name } = path.parse(appRelativePath);
  return ['.test.ts', '.test.tsx'].map((suffix) =>
    path.join(dir, '__tests__', `${name}${suffix}`),
  );
};

// The production sources to mutate: with `all`, every tracked source, otherwise the changed ones; the caller passes how to list each, and only the list that applies is read. File arguments select among them; scopeOfRequestedFiles says why an argument is none of them.
export const selectFiles = ({
  all,
  listChangedPaths,
  listTrackedPaths,
  requestedFiles,
}: {
  all: boolean;
  listChangedPaths: () => string[];
  listTrackedPaths: () => string[];
  requestedFiles: string[];
}) => {
  const candidates = [...new Set(all ? listTrackedPaths() : listChangedPaths())]
    .filter(isProductionSource)
    .sort();
  return {
    candidates,
    selected:
      requestedFiles.length > 0
        ? candidates.filter((file) => requestedFiles.includes(file))
        : candidates,
  };
};

// For each file argument, whether the run mutates it and, when not, why: `outOfScope` for a file that is no candidate, which fails the run before anything is mutated, and `untested` for a candidate without its own test file, which the run skips.
export const scopeOfRequestedFiles = ({
  all,
  baseBranch,
  candidates,
  requestedFiles,
  exists,
  hasOwnTestFile,
}: {
  all: boolean;
  baseBranch: string;
  candidates: string[];
  requestedFiles: string[];
  exists: (appRelativePath: string) => boolean;
  hasOwnTestFile: (appRelativePath: string) => boolean;
}) =>
  requestedFiles.map((file) => {
    const outOfScope = (reason: string) => ({
      file,
      status: 'outOfScope' as const,
      reason,
    });
    if (!exists(file)) return outOfScope('no such file under app/');
    if (!isProductionSource(file))
      return outOfScope(
        `not a production source: only the .ts files under ${PRODUCTION_DIRECTORIES.map((directory) => `${directory}/`).join(', ')} are mutated, no .tsx, declaration, test or generated file`,
      );
    if (!candidates.includes(file))
      return outOfScope(
        all
          ? 'not tracked by git'
          : `not changed against ${baseBranch}; --all mutates it as a whole`,
      );
    if (!hasOwnTestFile(file))
      return {
        file,
        status: 'untested' as const,
        reason: `no own test file (${testFileCandidates(file).join(' or ')})`,
      };
    return { file, status: 'mutated' as const, reason: null };
  });

type LineRange = { start: number; end: number };

// Sorted, with overlapping and adjacent ranges joined, so a ledger span that crosses a changed range lies inside one range.
const joinRanges = (ranges: LineRange[]) =>
  [...ranges]
    .sort((a, b) => a.start - b.start)
    .reduce<LineRange[]>((joined, range) => {
      const last = joined.at(-1) ?? null;
      if (last !== null && range.start <= last.end + 1)
        last.end = Math.max(last.end, range.end);
      else joined.push({ ...range });
      return joined;
    }, []);

// "all" for a file mutated as a whole (every file under `all`, and an untracked file); otherwise, for a file the branch changed, the lines it changed joined with the span of every ledger entry in that file, so a change elsewhere in the file that makes an accepted mutant killable fails the run as stale; a file the branch did not change gets no line.
export const lineRangesFor = ({
  all,
  appRelativePath,
  untrackedPaths,
  changedLines,
  ledgerSpans,
}: {
  all: boolean;
  appRelativePath: string;
  untrackedPaths: ReadonlySet<string>;
  changedLines: ReadonlyMap<string, LineRange[]>;
  ledgerSpans: (appRelativePath: string) => LineRange[];
}): FileRanges => {
  if (all || untrackedPaths.has(`app/${appRelativePath}`)) return 'all';
  const changed = changedLines.get(`app/${appRelativePath}`) ?? null;
  return changed === null
    ? []
    : joinRanges([...changed, ...ledgerSpans(appRelativePath)]);
};
