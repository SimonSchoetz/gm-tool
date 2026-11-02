// Re-aligns every Markdown table that `pnpm run markdown-lint` reports under MD060, then re-runs the lint and exits with its status.
// markdownlint-cli2 0.23.3 `--fix` does not fix MD060, and Prettier is not an option for these files: `app/.prettierignore` skips `docs/` and Prettier would also rewrite their front matter and embedded code.
// Only the tables the lint flags are rewritten, in the aligned style: every row padded to the widest cell of its column, the delimiter row filled with dashes.
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');

const runLint = () => {
  const result = spawnSync('pnpm', ['run', 'markdown-lint'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return result;
};

const TABLE_ROW = /^\s*\|.*\|\s*$/;
const DELIMITER_CELL = /^:?-+:?$/;
const MD060_FINDING = /^(.+?):(\d+)(?::\d+)? error MD060\b/;

const splitCells = (row: string) => {
  const cells: string[] = [];
  let current = '';
  const inner = row.trim().slice(1, -1);
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === '\\' && inner[i + 1] === '|') {
      current += '\\|';
      i++;
    } else if (inner[i] === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += inner[i];
    }
  }
  cells.push(current.trim());
  return cells;
};

const cellWidth = (cell: string) => Array.from(cell).length;

const alignTable = (rows: string[]) => {
  const indent = /^\s*/.exec(rows[0])?.[0] ?? '';
  const cells = rows.map(splitCells);
  const isDelimiterRow = (row: string[]) =>
    row.every((cell) => DELIMITER_CELL.test(cell));
  const columnCount = cells[0].length;
  const widths = Array.from({ length: columnCount }, (_, column) =>
    Math.max(
      3,
      ...cells
        .filter((row) => !isDelimiterRow(row))
        .map((row) => cellWidth(row[column] ?? '')),
    ),
  );
  return cells.map((row, rowIndex) => {
    const padded = widths.map((width, column) => {
      const cell = row[column] ?? '';
      if (rowIndex === 1 && isDelimiterRow(row)) {
        const left = cell.startsWith(':') ? ':' : '';
        const right = cell.endsWith(':') && cell.length > 1 ? ':' : '';
        return left + '-'.repeat(width - left.length - right.length) + right;
      }
      return cell + ' '.repeat(width - cellWidth(cell));
    });
    return `${indent}| ${padded.join(' | ')} |`;
  });
};

const flaggedLinesByFile = new Map<string, Set<number>>();
const firstLint = runLint();
for (const line of `${firstLint.stdout}\n${firstLint.stderr}`.split('\n')) {
  const finding = MD060_FINDING.exec(line);
  if (finding) {
    const lines = flaggedLinesByFile.get(finding[1]) ?? new Set<number>();
    lines.add(Number(finding[2]));
    flaggedLinesByFile.set(finding[1], lines);
  }
}

for (const [file, flagged] of flaggedLinesByFile) {
  const filePath = path.resolve(repositoryRoot, file);
  const fileLines = readFileSync(filePath, 'utf8').split('\n');
  for (const lineNumber of flagged) {
    let start = lineNumber - 1;
    let end = lineNumber - 1;
    while (start > 0 && TABLE_ROW.test(fileLines[start - 1])) start--;
    while (end < fileLines.length - 1 && TABLE_ROW.test(fileLines[end + 1]))
      end++;
    const aligned = alignTable(fileLines.slice(start, end + 1));
    fileLines.splice(start, end - start + 1, ...aligned);
  }
  writeFileSync(filePath, fileLines.join('\n'));
  console.log(`re-aligned ${flagged.size} flagged row(s) in ${file}`);
}

const finalLint = runLint();
process.stdout.write(finalLint.stdout);
process.stderr.write(finalLint.stderr);
process.exit(finalLint.status ?? 1);
