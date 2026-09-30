// @vitest-environment node

// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const appDir = path.resolve(import.meta.dirname, '../..');
const canaryDirName = `__no-cycle-canary-${String(process.pid)}__`;
const canaryDir = path.join(appDir, 'src', canaryDirName);
const aliasImporterPath = path.join(canaryDir, 'aliasImporter.ts');
const relativeImporterPath = path.join(canaryDir, 'relativeImporter.ts');

beforeAll(() => {
  fs.mkdirSync(canaryDir);
  fs.writeFileSync(
    aliasImporterPath,
    `import { relativeImporter } from '@/${canaryDirName}/relativeImporter';\n\nexport const aliasImporter = (): unknown => relativeImporter;\n`,
  );
  fs.writeFileSync(
    relativeImporterPath,
    `import { aliasImporter } from './aliasImporter';\n\nexport const relativeImporter = (): unknown => aliasImporter;\n`,
  );
});

afterAll(() => {
  fs.rmSync(canaryDir, { recursive: true, force: true });
});

describe('import-x/no-cycle under the project eslint.config.js', () => {
  it('reports a cycle whose one leg is an @/ alias import and whose other leg is a relative .ts import', async () => {
    const eslint = new ESLint({ cwd: appDir });
    const results = await eslint.lintFiles([
      aliasImporterPath,
      relativeImporterPath,
    ]);

    const filesReportingCycle = results
      .filter((result) =>
        result.messages.some(
          (message) => message.ruleId === 'import-x/no-cycle',
        ),
      )
      .map((result) => result.filePath)
      .sort();

    expect(filesReportingCycle).toEqual(
      [aliasImporterPath, relativeImporterPath].sort(),
    );
  }, 60_000);
});
