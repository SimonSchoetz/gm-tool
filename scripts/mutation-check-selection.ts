// Which files under app/ scripts/mutation-check.ts mutates, and which of their lines.
// Pure: the script passes in how to list the changed and the tracked paths, and checks which candidate test files exist. Every path is relative to app/.
import path from 'path';
import type { MutatedRanges } from './mutation-check-ledger.ts';

// The ESLint rules are plain JavaScript, with their tests beside them in `__tests__/`.
const JAVASCRIPT_DIRECTORY = 'eslint-rules';

const PRODUCTION_DIRECTORIES = [
  'src',
  'services',
  'domain',
  'db',
  'dev-data-server',
  'platform',
  'util',
  JAVASCRIPT_DIRECTORY,
];

type FileRanges = NonNullable<ReturnType<MutatedRanges['get']>>;

const inJavascriptDirectory = (appRelativePath: string) =>
  appRelativePath.startsWith(`${JAVASCRIPT_DIRECTORY}/`);

const sourceExtensions = (appRelativePath: string) =>
  inJavascriptDirectory(appRelativePath)
    ? ['.ts', '.tsx', '.js']
    : ['.ts', '.tsx'];

// eslint-disable-next-line local/no-unused-exports -- tests pin which paths are production sources, apart from the selection that uses it
export const isProductionSource = (appRelativePath: string) =>
  PRODUCTION_DIRECTORIES.some((directory) =>
    appRelativePath.startsWith(`${directory}/`),
  ) &&
  sourceExtensions(appRelativePath).includes(path.extname(appRelativePath)) &&
  !appRelativePath.endsWith('.d.ts') &&
  !appRelativePath.includes('__tests__/') &&
  appRelativePath !== 'src/routeTree.gen.ts';

// The paths a source's own test file can have; the source has one when any of them exists.
export const testFileCandidates = (appRelativePath: string) => {
  const { dir, name } = path.parse(appRelativePath);
  const suffixes = inJavascriptDirectory(appRelativePath)
    ? ['.test.ts', '.test.tsx', '.test.js']
    : ['.test.ts', '.test.tsx'];
  return suffixes.map((suffix) =>
    path.join(dir, '__tests__', `${name}${suffix}`),
  );
};

// The production sources to mutate: with `all`, every tracked source, otherwise the changed ones; the caller passes how to list each, and only the list that applies is read. File arguments select among them, and an argument that is none of them is returned as unknown.
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
    unknown: requestedFiles.filter((file) => !candidates.includes(file)),
  };
};

// "all" for a file mutated as a whole (every file under `all`, and an untracked file); otherwise the lines the branch changed.
export const lineRangesFor = ({
  all,
  appRelativePath,
  untrackedPaths,
  changedLines,
}: {
  all: boolean;
  appRelativePath: string;
  untrackedPaths: ReadonlySet<string>;
  changedLines: ReadonlyMap<string, { start: number; end: number }[]>;
}): FileRanges =>
  all || untrackedPaths.has(`app/${appRelativePath}`)
    ? 'all'
    : (changedLines.get(`app/${appRelativePath}`) ?? []);
