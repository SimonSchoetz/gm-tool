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

const useContextSource = `import { createContext, useContext } from 'react';\n\nconst CanaryContext = createContext<number | null>(null);\n\nexport const readCanary = (): number | null => useContext(CanaryContext);\n`;
const writesUndefinedSource = `export const value = (flag: boolean): string | null =>\n  flag ? 'set' : null;\nexport const sentinel = undefined;\n`;
const lookupSource = `type Finder = { find: (key: string) => string };\n\nexport const fromArray = (items: string[]): string | undefined =>\n  items.find((item) => item === 'a');\n\nexport const fromFinder = (finder: Finder): string => finder.find('a');\n`;
const addedLookupSource = `type Getter = { get: (key: string) => string };\n\nexport const lastMatch = (items: string[]): string | undefined =>\n  items.findLast((item) => item === 'a');\nexport const firstItem = (items: string[]): string | undefined =>\n  items.shift();\nexport const fromMap = (map: Map<string, string>): string | undefined =>\n  map.get('a');\nexport const fromParams = (params: URLSearchParams): string | null =>\n  params.get('a');\nexport const fromGetter = (getter: Getter): string => getter.get('a');\n`;

/** @type {Map<string, import('eslint').Linter.LintMessage[]>} */
const messagesByPath = new Map();

beforeAll(async () => {
  fs.mkdirSync(path.join(srcCanaryDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(servicesCanaryDir, '__tests__'), { recursive: true });
  fs.writeFileSync(componentPath, useContextSource);
  fs.writeFileSync(readerHookPath, useContextSource);
  fs.writeFileSync(hooksFolderPath, useContextSource);
  fs.writeFileSync(srcUndefinedPath, writesUndefinedSource);
  fs.writeFileSync(serviceUndefinedPath, writesUndefinedSource);
  fs.writeFileSync(serviceTestPath, writesUndefinedSource);
  fs.writeFileSync(lookupPath, lookupSource);
  fs.writeFileSync(addedLookupPath, addedLookupSource);

  const eslint = new ESLint({ cwd: appDir });
  const results = await eslint.lintFiles([srcCanaryDir, servicesCanaryDir]);
  for (const result of results) {
    messagesByPath.set(result.filePath, result.messages);
  }
}, 120_000);

afterAll(() => {
  fs.rmSync(srcCanaryDir, { recursive: true, force: true });
  fs.rmSync(servicesCanaryDir, { recursive: true, force: true });
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
