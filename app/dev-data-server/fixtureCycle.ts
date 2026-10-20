// Node host — imported by vitePlugin.ts: the fixture images the web-mode file dialog hands out, in file-name order, one per call.
import { basename, extname } from 'node:path';

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
