// Node host: the committed fixture images, and the cycle in which the web-mode file dialog hands them out, in file-name order, one per call.
import { readdirSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const FIXTURES_DIR = resolve(import.meta.dirname, 'fixtures/images');

export const readFixturePaths = (): string[] =>
  readdirSync(FIXTURES_DIR).map((name) => join(FIXTURES_DIR, name));

export const createFixtureCycle = (
  fixturePaths: readonly string[],
): ((extensions: readonly string[]) => string | null) => {
  const sorted = [...fixturePaths].sort((a, b) =>
    basename(a).localeCompare(basename(b)),
  );
  let lastIndex = -1;
  return (extensions) => {
    for (let step = 1; step <= sorted.length; step++) {
      const index = (lastIndex + step) % sorted.length;
      const candidate = sorted[index];
      if (extensions.includes(extname(candidate).slice(1).toLowerCase())) {
        lastIndex = index;
        return candidate;
      }
    }
    return null;
  };
};
