// Reports every raw value in a component stylesheet under `app/src/` that equals what a token in `app/src/styles/variables/` resolves to, and exits 1 when there is one.
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { buildTokenIndex, findRawValueHits } from './css-token-check-find.ts';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(repositoryRoot, 'app/src');
const stylesRoot = path.join(sourceRoot, 'styles');
const variablesRoot = path.join(stylesRoot, 'variables');

const cssFilesUnder = (directory: string) =>
  readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.css'))
    .map((file) => path.join(directory, file));

const read = (file: string) => readFileSync(file, 'utf8');

const index = buildTokenIndex(cssFilesUnder(variablesRoot).map(read));
const stylesheets = cssFilesUnder(sourceRoot).filter(
  (file) => !file.startsWith(stylesRoot + path.sep),
);

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
    `css-token-check: ${hitCount} raw value(s) equal a design token — use the token, or mark the line with a /* one-off */ comment.`,
  );
  process.exit(1);
}
