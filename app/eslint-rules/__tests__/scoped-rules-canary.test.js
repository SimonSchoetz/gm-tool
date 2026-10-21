// @vitest-environment node

// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const appDir = path.resolve(import.meta.dirname, '../..');
const canaryDirName = `__scoped-rules-canary-${String(process.pid)}__`;
const srcCanaryDir = path.join(appDir, 'src', canaryDirName);
const servicesCanaryDir = path.join(appDir, 'services', canaryDirName);
const platformCanaryDir = path.join(appDir, 'platform', canaryDirName);

const componentPath = path.join(srcCanaryDir, 'CanaryComponent.tsx');
const readerHookPath = path.join(srcCanaryDir, 'useCanaryContext.ts');
const hooksFolderPath = path.join(srcCanaryDir, 'hooks', 'readCanary.ts');
const srcUndefinedPath = path.join(srcCanaryDir, 'writesUndefined.ts');
const serviceUndefinedPath = path.join(servicesCanaryDir, 'writesUndefined.ts');
const serviceTestPath = path.join(
  servicesCanaryDir,
  '__tests__',
  'writesUndefined.test.ts',
);
const lookupPath = path.join(srcCanaryDir, 'lookups.ts');
const addedLookupPath = path.join(srcCanaryDir, 'addedLookups.ts');
const srcTauriImportPath = path.join(srcCanaryDir, 'importsTauri.ts');
const platformTauriImportPath = path.join(platformCanaryDir, 'importsTauri.ts');
const srcTauriTypeImportPath = path.join(srcCanaryDir, 'importsTauriType.ts');
const srcDevDataServerImportPath = path.join(
  srcCanaryDir,
  'importsDevDataServer.ts',
);
const srcToThrowTestPath = path.join(
  srcCanaryDir,
  '__tests__',
  'toThrowMatchers.test.ts',
);

const useContextSource = `import { createContext, useContext } from 'react';\n\nconst CanaryContext = createContext<number | null>(null);\n\nexport const readCanary = (): number | null => useContext(CanaryContext);\n`;
const writesUndefinedSource = `export const value = (flag: boolean): string | null =>\n  flag ? 'set' : null;\nexport const sentinel = undefined;\n`;
const lookupSource = `type Finder = { find: (key: string) => string };\n\nexport const fromArray = (items: string[]): string | undefined =>\n  items.find((item) => item === 'a');\n\nexport const fromFinder = (finder: Finder): string => finder.find('a');\n`;
const addedLookupSource = `type Getter = { get: (key: string) => string };\n\nexport const lastMatch = (items: string[]): string | undefined =>\n  items.findLast((item) => item === 'a');\nexport const firstItem = (items: string[]): string | undefined =>\n  items.shift();\nexport const fromMap = (map: Map<string, string>): string | undefined =>\n  map.get('a');\nexport const fromParams = (params: URLSearchParams): string | null =>\n  params.get('a');\nexport const fromGetter = (getter: Getter): string => getter.get('a');\n`;
const tauriImportSource = `import { invoke } from '@tauri-apps/api/core';\n\nexport const callsTauri = (): Promise<unknown> => invoke('ping');\n`;
const tauriTypeImportSource = `import type { InvokeArgs } from '@tauri-apps/api/core';\n\nexport const describesArgs = (args: InvokeArgs): InvokeArgs => args;\n`;
const toThrowMatchersSource = `import { expect } from 'vitest';\n\nconst fail = (): never => {\n  throw new Error('boom: disk full');\n};\n\nexpect(fail).toThrow('boom');\nexpect(fail).toThrow(/^boom/);\nexpect(fail).toThrow(/^boom: disk full$/);\nexpect(fail).toThrow();\nexpect(fail).not.toThrow(TypeError);\nexport enum Canary {\n  A,\n}\n`;
const devDataServerImportSource = `import { devDataServer } from '../../dev-data-server/vitePlugin';\nimport { DEV_DATA_SERVER_PREFIX } from '../../dev-data-server/protocol';\n\nexport const devDataServerCanary = [devDataServer, DEV_DATA_SERVER_PREFIX];\n`;

/** @type {Map<string, import('eslint').Linter.LintMessage[]>} */
const messagesByPath = new Map();

beforeAll(async () => {
  fs.mkdirSync(path.join(srcCanaryDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(srcCanaryDir, '__tests__'), { recursive: true });
  fs.mkdirSync(path.join(servicesCanaryDir, '__tests__'), { recursive: true });
  fs.mkdirSync(platformCanaryDir, { recursive: true });
  fs.writeFileSync(componentPath, useContextSource);
  fs.writeFileSync(readerHookPath, useContextSource);
  fs.writeFileSync(hooksFolderPath, useContextSource);
  fs.writeFileSync(srcUndefinedPath, writesUndefinedSource);
  fs.writeFileSync(serviceUndefinedPath, writesUndefinedSource);
  fs.writeFileSync(serviceTestPath, writesUndefinedSource);
  fs.writeFileSync(lookupPath, lookupSource);
  fs.writeFileSync(addedLookupPath, addedLookupSource);
  fs.writeFileSync(srcTauriImportPath, tauriImportSource);
  fs.writeFileSync(platformTauriImportPath, tauriImportSource);
  fs.writeFileSync(srcTauriTypeImportPath, tauriTypeImportSource);
  fs.writeFileSync(srcDevDataServerImportPath, devDataServerImportSource);
  fs.writeFileSync(srcToThrowTestPath, toThrowMatchersSource);

  const eslint = new ESLint({ cwd: appDir });
  const results = await eslint.lintFiles([
    srcCanaryDir,
    servicesCanaryDir,
    platformCanaryDir,
  ]);
  for (const result of results) {
    messagesByPath.set(result.filePath, result.messages);
  }
}, 120_000);

afterAll(() => {
  fs.rmSync(srcCanaryDir, { recursive: true, force: true });
  fs.rmSync(servicesCanaryDir, { recursive: true, force: true });
  fs.rmSync(platformCanaryDir, { recursive: true, force: true });
});

/** @param {string} filePath @param {string} ruleId */
const linesReportedBy = (filePath, ruleId) =>
  (messagesByPath.get(filePath) ?? [])
    .filter((message) => message.ruleId === ruleId)
    .map((message) => message.line);

describe('the useContext restriction under the project eslint.config.js', () => {
  it('reports the import in a component file but not in a use*.ts file or under a hooks/ folder', () => {
    expect(linesReportedBy(componentPath, 'no-restricted-imports')).toEqual([
      1,
    ]);
    expect(linesReportedBy(readerHookPath, 'no-restricted-imports')).toEqual(
      [],
    );
    expect(linesReportedBy(hooksFolderPath, 'no-restricted-imports')).toEqual(
      [],
    );
  });
});

describe('the written-undefined selectors under the project eslint.config.js', () => {
  it('report a written undefined in services/ but not in src/ or in a services/ test', () => {
    expect(
      linesReportedBy(serviceUndefinedPath, 'no-restricted-syntax'),
    ).toEqual([3]);
    expect(linesReportedBy(srcUndefinedPath, 'no-restricted-syntax')).toEqual(
      [],
    );
    expect(linesReportedBy(serviceTestPath, 'no-restricted-syntax')).toEqual(
      [],
    );
  });
});

describe('local/no-unnormalized-lookup-result under the project eslint.config.js', () => {
  it('reports a returned array .find() whose type holds undefined and passes a .find() typed to return a string', () => {
    expect(
      linesReportedBy(lookupPath, 'local/no-unnormalized-lookup-result'),
    ).toEqual([4]);
  });

  it('reports returned .findLast(), .shift() and Map .get() results and passes a .get() typed to return string | null or string', () => {
    expect(
      linesReportedBy(addedLookupPath, 'local/no-unnormalized-lookup-result'),
    ).toEqual([4, 6, 8]);
  });
});

describe('the Tauri import restriction under the project eslint.config.js', () => {
  it('reports a runtime @tauri-apps import under src/ on its import line', () => {
    expect(
      linesReportedBy(
        srcTauriImportPath,
        '@typescript-eslint/no-restricted-imports',
      ),
    ).toEqual([1]);
  });

  it('does not report the same runtime import under platform/', () => {
    expect(
      linesReportedBy(
        platformTauriImportPath,
        '@typescript-eslint/no-restricted-imports',
      ),
    ).toEqual([]);
  });

  it('does not report a type-only @tauri-apps import under src/', () => {
    expect(
      linesReportedBy(
        srcTauriTypeImportPath,
        '@typescript-eslint/no-restricted-imports',
      ),
    ).toEqual([]);
  });
});

describe('the dev data server boundary under the project eslint.config.js', () => {
  it('reports an import of a Node-host dev-data-server file under src/ and not the protocol import beside it', () => {
    expect(
      linesReportedBy(
        srcDevDataServerImportPath,
        'import-x/no-restricted-paths',
      ),
    ).toEqual([1]);
  });
});

describe('the loose toThrow matcher selectors under the project eslint.config.js', () => {
  it('report a string and a RegExp not ending in $ in a test file, pass an anchored RegExp, no argument and an error class, and keep the enum ban', () => {
    expect(linesReportedBy(srcToThrowTestPath, 'no-restricted-syntax')).toEqual(
      [7, 8, 12],
    );
  });
});
