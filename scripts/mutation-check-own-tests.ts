// The test files that sit beside a mutated source as its own: `__tests__/<name>.test.ts` or `.test.tsx` in the source's folder, the file app/CLAUDE.md and the layer rules name as that source's test.
// scripts/mutation-check-related.ts runs these before the related set: a source behind a barrel such as app/db/util/index.ts is related to every test that imports the barrel (149 files for a db/util file), and a mutant only its own test kills would otherwise wait for that test's turn among them.
import { existsSync } from 'fs';
import path from 'path';

export const ownTestFiles = (
  sources: string[],
  // eslint-disable-next-line local/no-constant-argument -- tests inject the file check in place of the real filesystem
  exists: (file: string) => boolean = existsSync,
): string[] =>
  sources.flatMap((source) => {
    const name = path.basename(source).replace(/\.tsx?$/, '');
    const testsFolder = path.join(path.dirname(source), '__tests__');
    return ['.test.ts', '.test.tsx']
      .map((extension) => path.join(testsFolder, `${name}${extension}`))
      .filter(exists);
  });
