// Reports every raw value in a component stylesheet under `app/src/` that equals a token of its property's family in `app/src/styles/variables/`, and exits 1 when there is one. `--staged` limits the report to the stylesheets staged for commit.
import { execFileSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import {
  buildTokenIndex,
  findRawValueHits,
  isComponentStylesheet,
} from './css-token-check-find.ts';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(repositoryRoot, 'app/src');
const variablesRoot = path.join(sourceRoot, 'styles/variables');

const cssFilesUnder = (directory: string) =>
  readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.css'))
    .map((file) => path.join(directory, file));

const read = (file: string) => readFileSync(file, 'utf8');

const index = buildTokenIndex(cssFilesUnder(variablesRoot).map(read));

const stagedPaths = () =>
  execFileSync(
    'git',
    [
      'diff',
      '--cached',
      '--name-only',
      '--no-renames',
      '--diff-filter=d',
      '-z',
    ],
    { cwd: repositoryRoot, encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);

const allSourcePaths = () =>
  cssFilesUnder(sourceRoot).map((file) => path.relative(repositoryRoot, file));

const stylesheets = (
  process.argv.includes('--staged') ? stagedPaths() : allSourcePaths()
)
  .filter(isComponentStylesheet)
  .map((file) => path.join(repositoryRoot, file));

let hitCount = 0;
for (const file of stylesheets) {
  for (const hit of findRawValueHits(read(file), index)) {
    hitCount++;
    console.log(
      `${path.relative(repositoryRoot, file)}:${hit.line}:${hit.column} ${hit.value} equals ${hit.tokens.join(', ')}`,
    );
  }
}

if (hitCount > 0) {
  console.error(
    `css-token-check: ${hitCount} raw value(s) equal a design token of the same family — use the token; a /* one-off */ marker is the user's decision.`,
  );
  process.exit(1);
}
