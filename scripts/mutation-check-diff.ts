// The lines a branch added or changed per file, for scripts/mutation-check.ts.
// One `git diff` over every given path, with rename detection forced on (`-M`) so it holds whatever `diff.renames` is set to: a file moved with `git mv` is diffed against its old path, so it contributes only the lines changed after the move rather than counting as new as a whole. A diff limited to the new path alone would see no rename source and report every line as added.
import { execFileSync } from 'child_process';

type LineRange = { start: number; end: number };

// Each file the diff names on its new side (deleted files are filtered out), mapped to its added or changed lines as inclusive intervals; an empty list for a file with lines removed only, or moved without a change.
// eslint-disable-next-line local/no-unused-exports -- tests parse diff text without running git
export const parseChangedLines = (diff: string) => {
  const changedLines = new Map<string, LineRange[]>();
  let currentFile: string | null = null;
  // Paths are read only from a file's header, before its first hunk: an added line `++ b/x` reads `+++ b/x` in the hunk body.
  let inHeader = false;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git ')) {
      currentFile = null;
      inHeader = true;
      continue;
    }
    // A rename without a content change has no `+++` line, only `rename to`.
    const newPath = inHeader
      ? /^(?:rename to |\+\+\+ b\/)(.+)$/.exec(line)?.[1]
      : undefined;
    if (newPath !== undefined) {
      currentFile = newPath;
      changedLines.set(newPath, []);
      continue;
    }
    const hunk = /^@@ -\S+ \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk === null || currentFile === null) continue;
    inHeader = false;
    const [, start, count = '1'] = hunk;
    if (Number(count) === 0) continue;
    changedLines
      .get(currentFile)
      ?.push({ start: Number(start), end: Number(start) + Number(count) - 1 });
  }
  return changedLines;
};

// The working tree (committed, staged and unstaged changes) against `base`, limited to `paths`; untracked files are not part of it.
export const changedLinesAgainst = ({
  cwd,
  base,
  paths,
}: {
  cwd: string;
  base: string;
  paths: string[];
}) =>
  parseChangedLines(
    execFileSync(
      'git',
      [
        '-c',
        'core.quotePath=false',
        'diff',
        '-M',
        '--unified=0',
        '--no-color',
        '--no-ext-diff',
        '--diff-filter=d',
        base,
        '--',
        ...paths,
      ],
      { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 },
    ),
  );
