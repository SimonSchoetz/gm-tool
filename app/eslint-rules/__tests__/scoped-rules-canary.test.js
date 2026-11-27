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
const srcInlineHandlerPath = path.join(srcCanaryDir, 'InlineHandler.tsx');
const srcInlineHandlerTestPath = path.join(
  srcCanaryDir,
  '__tests__',
  'InlineHandler.test.tsx',
);

const useContextSource = `import { createContext, useContext } from 'react';\n\nconst CanaryContext = createContext<number | null>(null);\n\nexport const readCanary = (): number | null => useContext(CanaryContext);\n`;
const writesUndefinedSource = `export const value = (flag: boolean): string | null =>\n  flag ? 'set' : null;\nexport const sentinel = undefined;\n`;
const lookupSource = `type Finder = { find: (key: string) => string };\n\nexport const fromArray = (items: string[]): string | undefined =>\n  items.find((item) => item === 'a');\n\nexport const fromFinder = (finder: Finder): string => finder.find('a');\n`;
const addedLookupSource = `type Getter = { get: (key: string) => string };\n\nexport const lastMatch = (items: string[]): string | undefined =>\n  items.findLast((item) => item === 'a');\nexport const firstItem = (items: string[]): string | undefined =>\n  items.shift();\nexport const fromMap = (map: Map<string, string>): string | undefined =>\n  map.get('a');\nexport const fromParams = (params: URLSearchParams): string | null =>\n  params.get('a');\nexport const fromGetter = (getter: Getter): string => getter.get('a');\n`;
const tauriImportSource = `import { invoke } from '@tauri-apps/api/core';\n\nexport const callsTauri = (): Promise<unknown> => invoke('ping');\n`;
const tauriTypeImportSource = `import type { InvokeArgs } from '@tauri-apps/api/core';\n\nexport const describesArgs = (args: InvokeArgs): InvokeArgs => args;\n`;
const toThrowMatchersSource = `import { expect } from 'vitest';\n\nconst fail = (): never => {\n  throw new Error('boom: disk full');\n};\n\nexpect(fail).toThrow('boom');\nexpect(fail).toThrow(/^boom/);\nexpect(fail).toThrow(/^boom: disk full$/);\nexpect(fail).toThrow();\nexpect(fail).not.toThrow(TypeError);\nexport enum Canary {\n  A,\n}\n`;
const inlineHandlerSource = `export const InlineHandler = ({ go }: { go: () => void }) => (\n  <button onClick={() => { go(); }}>x</button>\n);\n`;
const devDataServerImportSource = `import { devDataServer } from '../../dev-data-server/vitePlugin';\nimport { DEV_DATA_SERVER_PREFIX } from '../../dev-data-server/protocol';\n\nexport const devDataServerCanary = [devDataServer, DEV_DATA_SERVER_PREFIX];\n`;

/** @param {string} root @param {string[]} segments */
const canaryPath = (root, ...segments) =>
  path.join(appDir, root, canaryDirName, ...segments);

const enumLine = 'export enum Canary { A }';
const undefinedLine = 'export const sentinel = undefined;';
const classLine = 'export class Plain {}';
const extendingClassLine = 'export class Extending extends Base {}';
const tryLine =
  'export const attempt = (work: () => void): void => { try { work(); } finally { work(); } };';
const looseToThrowLine = "expect(fail).toThrow('boom');";
const rawReactTypeLine = 'export type Raw = React.FC<{ label: string }>;';
const rawHtmlPropsLine = 'export type Props = React.HTMLProps<HTMLDivElement>;';
const exportStarLine = "export * from './syntax';";
const textInputLine = 'export const field = <input type="text" />;';

const nonUiLayers = ['db', 'domain', 'services', 'util', 'platform'];
const noTryLayers = ['src/data-access-layer', 'src/screens'];

/**
 * One scope of the `no-restricted-syntax` blocks: each line of `banned` must be reported exactly once in each of `paths`, and no line of `allowed` in any of `allowedPaths`. `asText` marks paths that already exist, so the lines are linted as text under them instead of being written there.
 * @typedef {object} SyntaxScope
 * @property {string} name
 * @property {string[]} paths
 * @property {string[]} banned
 * @property {string[]} allowedPaths
 * @property {string[]} allowed
 * @property {boolean} [asText]
 */

// A syntax canary under __tests__/ is named without `.test.`, so a Vitest run that collects test files while it exists does not pick it up.
/** @type {SyntaxScope[]} */
const syntaxScopes = [
  {
    name: 'keeps the enum ban in a file no later syntax block matches',
    paths: [path.join(appDir, 'vite.config.ts')],
    banned: [enumLine],
    allowedPaths: [],
    allowed: [],
    asText: true,
  },
  {
    name: 'reports a string toThrow and an enum in a test outside src/ and services/__tests__/, and passes a class without extends and a written undefined there',
    paths: [canaryPath('domain', '__tests__', 'syntax.ts')],
    banned: [looseToThrowLine, enumLine],
    allowedPaths: [canaryPath('domain', '__tests__', 'allowedSyntax.ts')],
    allowed: [classLine, undefinedLine],
  },
  {
    name: 'reports a class without extends, an error class, a written undefined and an enum in each non-UI layer, and passes an extending class and an error type alias',
    paths: nonUiLayers.map((layer) => canaryPath(layer, 'syntax.ts')),
    banned: [
      classLine,
      'export const Anonymous = class {};',
      'export class Failure extends Error {}',
      'export const Wrapped = class extends Error {};',
      'export class LoadError extends Base {}',
      'export const Named = class SaveError extends Base {};',
      undefinedLine,
      enumLine,
    ],
    allowedPaths: nonUiLayers.map((layer) =>
      canaryPath(layer, 'allowedSyntax.ts'),
    ),
    allowed: [
      extendingClassLine,
      'export const Expression = class Other extends Base {};',
      "export type SessionLoadError = Error & { name: 'SessionLoadError' };",
    ],
  },
  {
    name: 'passes export * in a barrel under domain/',
    paths: [],
    banned: [],
    allowedPaths: [canaryPath('domain', 'index.ts')],
    allowed: [exportStarLine],
  },
  {
    name: 'reports a written undefined and an enum under dev-data-server/, and passes a class without extends there',
    paths: [canaryPath('dev-data-server', 'syntax.ts')],
    banned: [undefinedLine, enumLine],
    allowedPaths: [canaryPath('dev-data-server', 'allowedSyntax.ts')],
    allowed: [classLine],
  },
  {
    name: 'reports export * in a barrel under db/ beside the non-UI bans, and passes a named re-export',
    paths: [canaryPath('db', 'index.ts')],
    banned: [exportStarLine, classLine, undefinedLine, enumLine],
    allowedPaths: [canaryPath('db', 'allowed', 'index.ts')],
    allowed: ["export { Plain } from '../syntax';"],
  },
  {
    name: 'reports a buildCreateQuery import in a duplicate.ts under db/ beside the non-UI bans, and passes buildDuplicateQuery',
    paths: [canaryPath('db', 'duplicate.ts')],
    banned: [
      "import { buildCreateQuery } from '../util';",
      classLine,
      undefinedLine,
      enumLine,
    ],
    allowedPaths: [canaryPath('db', 'allowed', 'duplicate.ts')],
    allowed: ["import { buildDuplicateQuery } from '../../util';"],
  },
  {
    name: 'reports a class without extends, the raw React types, a type="text" input and an enum under src/, and passes the project aliases, other inputs and a try',
    paths: [canaryPath('src', 'syntax.tsx')],
    banned: [
      classLine,
      rawReactTypeLine,
      rawHtmlPropsLine,
      'export type Attributes = React.InputHTMLAttributes<HTMLInputElement>;',
      'export type BareComponent = FC<{ label: string }>;',
      'export type BareProps = HTMLProps<HTMLDivElement>;',
      'export type BareAttributes = ButtonHTMLAttributes<HTMLButtonElement>;',
      textInputLine,
      "export const braced = <input type={'text'} />;",
      enumLine,
    ],
    allowedPaths: [canaryPath('src', 'allowedSyntax.tsx')],
    allowed: [
      extendingClassLine,
      "export type Div = HtmlProps<'div'>;",
      'export type Component = FCProps<{ label: string }>;',
      "export type Inherited = React.ComponentProps<'div'>;",
      'export type Detailed = React.DetailedHTMLProps<object, HTMLDivElement>;',
      'export const checkbox = <input type="checkbox" />;',
      'export const bare = <input />;',
      'export const wrapped = <Input type="text" />;',
      tryLine,
    ],
  },
  {
    name: 'reports a class without extends, a type="text" input and an enum under src/types/, and passes the raw React types the aliases are declared over',
    paths: [canaryPath('src/types', 'syntax.tsx')],
    banned: [classLine, textInputLine, enumLine],
    allowedPaths: [canaryPath('src/types', 'allowedSyntax.tsx')],
    allowed: [rawReactTypeLine, rawHtmlPropsLine],
  },
  {
    name: 'reports a try beside the src/ bans in the data access layer and in screens, and passes a promise catch',
    paths: noTryLayers.map((layer) => canaryPath(layer, 'syntax.tsx')),
    banned: [tryLine, classLine, rawReactTypeLine, textInputLine, enumLine],
    allowedPaths: noTryLayers.map((layer) =>
      canaryPath(layer, 'allowedSyntax.tsx'),
    ),
    allowed: [
      extendingClassLine,
      'export const recover = (work: () => Promise<void>): Promise<void> => work().catch(work);',
    ],
  },
  {
    name: 'reports export * in the two grouping barrels under src/ beside the bans of their layer, and passes a named re-export',
    paths: noTryLayers.map((layer) => path.join(appDir, layer, 'index.ts')),
    banned: [
      "export * from './canary';",
      tryLine,
      classLine,
      rawReactTypeLine,
      enumLine,
    ],
    allowedPaths: noTryLayers.map((layer) =>
      path.join(appDir, layer, 'index.ts'),
    ),
    allowed: ["export { canary } from './canary';"],
    asText: true,
  },
  {
    name: 'reports a string toThrow, a raw React type, a type="text" input and an enum in a test under src/, and passes a class without extends and a try there',
    paths: [canaryPath('src', '__tests__', 'syntax.tsx')],
    banned: [looseToThrowLine, rawReactTypeLine, textInputLine, enumLine],
    allowedPaths: [canaryPath('src', '__tests__', 'allowedSyntax.tsx')],
    allowed: [classLine, tryLine],
  },
  {
    name: 'reports an untyped vi.fn(), a string toThrow and an enum under services/__tests__/, and passes a typed spy and a spy given an implementation',
    paths: [canaryPath('services/__tests__', 'syntax.ts')],
    banned: ['export const spy = vi.fn();', looseToThrowLine, enumLine],
    allowedPaths: [canaryPath('services/__tests__', 'allowedSyntax.ts')],
    allowed: [
      'export const typed = vi.fn<() => void>();',
      'export const implemented = vi.fn(() => 1);',
    ],
  },
];

/** @param {string[]} lines */
const sourceOf = (lines) => `${lines.join('\n')}\n`;

/** @type {[string, string][]} */
const syntaxCanaryFiles = syntaxScopes
  .filter((scope) => !scope.asText)
  .flatMap((scope) => [
    ...scope.paths.map(
      (filePath) =>
        /** @type {[string, string]} */ ([filePath, sourceOf(scope.banned)]),
    ),
    ...scope.allowedPaths.map(
      (filePath) =>
        /** @type {[string, string]} */ ([filePath, sourceOf(scope.allowed)]),
    ),
  ]);

const canaryDirs = [
  srcCanaryDir,
  servicesCanaryDir,
  platformCanaryDir,
  ...[
    'db',
    'domain',
    'util',
    'dev-data-server',
    'services/__tests__',
    'src/data-access-layer',
    'src/screens',
    'src/types',
  ].map((root) => canaryPath(root)),
];

const eslint = new ESLint({ cwd: appDir });

/** @type {Map<string, import('eslint').Linter.LintMessage[]>} */
const messagesByPath = new Map();

beforeAll(async () => {
  fs.mkdirSync(path.join(srcCanaryDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(srcCanaryDir, '__tests__'), { recursive: true });
  fs.mkdirSync(path.join(servicesCanaryDir, '__tests__'), { recursive: true });
  fs.mkdirSync(platformCanaryDir, { recursive: true });
  for (const [filePath, source] of syntaxCanaryFiles) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source);
  }
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
  fs.writeFileSync(srcInlineHandlerPath, inlineHandlerSource);
  fs.writeFileSync(srcInlineHandlerTestPath, inlineHandlerSource);

  const results = await eslint.lintFiles(canaryDirs);
  for (const result of results) {
    messagesByPath.set(result.filePath, result.messages);
  }
}, 120_000);

afterAll(() => {
  for (const dir of canaryDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/** @param {import('eslint').Linter.LintMessage[] | null} messages @param {string} ruleId */
const linesIn = (messages, ruleId) => {
  // A file ESLint skipped or could not parse carries no rule's report, which would pass every case that expects none.
  if (!messages || messages.some((message) => message.fatal)) {
    throw new Error('ESLint did not lint this canary');
  }
  return messages
    .filter((message) => message.ruleId === ruleId)
    .map((message) => message.line);
};

/** @param {string} filePath @param {string} ruleId */
const linesReportedBy = (filePath, ruleId) =>
  linesIn(messagesByPath.get(filePath) ?? null, ruleId);

/** @param {SyntaxScope} scope @param {string} filePath @param {string[]} lines */
const syntaxLinesReported = async (scope, filePath, lines) => {
  if (!scope.asText) return linesReportedBy(filePath, 'no-restricted-syntax');
  const [result] = await eslint.lintText(sourceOf(lines), { filePath });
  return linesIn(result?.messages ?? null, 'no-restricted-syntax');
};

describe('the syntax selectors of each scope under the project eslint.config.js', () => {
  it.each(syntaxScopes)(
    '$name',
    async (scope) => {
      const everyBannedLine = scope.banned.map((_, index) => index + 1);
      for (const filePath of scope.paths) {
        expect(
          await syntaxLinesReported(scope, filePath, scope.banned),
          filePath,
        ).toEqual(everyBannedLine);
      }
      for (const filePath of scope.allowedPaths) {
        expect(
          await syntaxLinesReported(scope, filePath, scope.allowed),
          filePath,
        ).toEqual([]);
      }
    },
    120_000,
  );
});

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

describe('local/no-inline-jsx-values under the project eslint.config.js', () => {
  it('reports an inline arrow function as a JSX attribute value in a src component file and not the same code in a src __tests__ file', () => {
    expect(
      linesReportedBy(srcInlineHandlerPath, 'local/no-inline-jsx-values'),
    ).toEqual([2]);
    expect(
      linesReportedBy(srcInlineHandlerTestPath, 'local/no-inline-jsx-values'),
    ).toEqual([]);
  });
});
