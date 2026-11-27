// @vitest-environment node

// @ts-check

// A canary under __tests__/ is named without `.test.`, so a Vitest run that collects test files while it exists does not pick it up.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const appDir = path.resolve(import.meta.dirname, '../..');
const canaryDirName = `__scoped-rules-canary-${String(process.pid)}__`;
/** @param {string} root @param {string[]} segments */
const canaryPath = (root, ...segments) =>
  path.join(appDir, root, canaryDirName, ...segments);
const srcCanaryDir = canaryPath('src');
const platformCanaryDir = canaryPath('platform');

const componentPath = path.join(srcCanaryDir, 'CanaryComponent.tsx');
const readerHookPath = path.join(srcCanaryDir, 'useCanaryContext.ts');
const hooksFolderPath = path.join(srcCanaryDir, 'hooks', 'readCanary.ts');
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
  'toThrowMatchers.ts',
);
const srcInlineHandlerPath = path.join(srcCanaryDir, 'InlineHandler.tsx');
const srcInlineHandlerTestPath = path.join(
  srcCanaryDir,
  '__tests__',
  'InlineHandler.tsx',
);

const tauriValueImport = "import { invoke } from '@tauri-apps/api/core';";
const useContextSource = `import { createContext, useContext } from 'react';\n\nconst CanaryContext = createContext<number | null>(null);\n\nexport const readCanary = (): number | null => useContext(CanaryContext);\n`;
const lookupSource = `type Finder = { find: (key: string) => string };\n\nexport const fromArray = (items: string[]): string | undefined =>\n  items.find((item) => item === 'a');\n\nexport const fromFinder = (finder: Finder): string => finder.find('a');\n`;
const addedLookupSource = `type Getter = { get: (key: string) => string };\n\nexport const lastMatch = (items: string[]): string | undefined =>\n  items.findLast((item) => item === 'a');\nexport const firstItem = (items: string[]): string | undefined =>\n  items.shift();\nexport const fromMap = (map: Map<string, string>): string | undefined =>\n  map.get('a');\nexport const fromParams = (params: URLSearchParams): string | null =>\n  params.get('a');\nexport const fromGetter = (getter: Getter): string => getter.get('a');\n`;
const tauriImportSource = `${tauriValueImport}\n\nexport const callsTauri = (): Promise<unknown> => invoke('ping');\n`;
const tauriTypeImportSource = `import type { InvokeArgs } from '@tauri-apps/api/core';\n\nexport const describesArgs = (args: InvokeArgs): InvokeArgs => args;\n`;
const toThrowMatchersSource = `import { expect } from 'vitest';\n\nconst fail = (): never => {\n  throw new Error('boom: disk full');\n};\n\nexpect(fail).toThrow(/^boom/);\nexpect(fail).toThrow(/^boom: disk full$/);\nexpect(fail).toThrow();\nexpect(fail).not.toThrow(TypeError);\n`;
const inlineHandlerSource = `export const InlineHandler = ({ go }: { go: () => void }) => (\n  <button onClick={() => { go(); }}>x</button>\n);\n`;
const devDataServerImportSource = `import { devDataServer } from '../../dev-data-server/vitePlugin';\nimport { DEV_DATA_SERVER_PREFIX } from '../../dev-data-server/protocol';\n\nexport const devDataServerCanary = [devDataServer, DEV_DATA_SERVER_PREFIX];\n`;

const enumLine = 'export enum Canary { A }';
const undefinedLine = 'export const sentinel = undefined;';
const classLine = 'export class Plain {}';
const extendingClassLine = 'export class Extending extends Base {}';
const tryCatchLine =
  'export const attempt = (work: () => void): void => { try { work(); } catch { work(); } };';
const tryFinallyLine =
  'export const cleanUp = (work: () => void): void => { try { work(); } finally { work(); } };';
const looseToThrowLine = "expect(fail).toThrow('boom');";
const rawReactTypeLine = 'export type Raw = React.FC<{ label: string }>;';
const rawHtmlPropsLine = 'export type Props = React.HTMLProps<HTMLDivElement>;';
const exportStarLine = "export * from './syntax';";
const textInputLine = 'export const field = <input type="text" />;';

const nonUiLayers = ['db', 'domain', 'services', 'util', 'platform'];
const noTryCatchLayers = ['src/data-access-layer', 'src/screens'];
// src/ itself and each directory below it that has a syntax block of its own.
const srcTestRoots = ['src', 'src/types', ...noTryCatchLayers];
const srcGroupingBarrels = [
  'src/data-access-layer/index.ts',
  'src/screens/index.ts',
].map((file) => path.join(appDir, file));
/** Tests outside src/ and services/__tests__/: under a layer, under dev-data-server/, and named like the two db/ files that have bans of their own. */
const otherTestFiles = [
  ['domain', 'syntax.ts'],
  ['dev-data-server', 'syntax.ts'],
  ['db', 'index.ts'],
  ['db', 'duplicate.ts'],
];

/**
 * One scope of a rule's config blocks: each line of `banned` must be reported exactly once in each of `paths`, and no line of `allowed` in any of `allowedPaths`. `asText` marks paths that already exist, so the lines are linted as text under them instead of being written there.
 * @typedef {object} CanaryScope
 * @property {string} name
 * @property {string[]} paths
 * @property {string[]} banned
 * @property {string[]} allowedPaths
 * @property {string[]} allowed
 * @property {boolean} [asText]
 */

/** @type {CanaryScope[]} */
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
    paths: otherTestFiles.map(([root, file]) =>
      canaryPath(root, '__tests__', file),
    ),
    banned: [looseToThrowLine, enumLine],
    allowedPaths: [
      canaryPath('domain', '__tests__', 'allowedSyntax.ts'),
      canaryPath('dev-data-server', '__tests__', 'allowedSyntax.ts'),
    ],
    allowed: [classLine, undefinedLine],
  },
  {
    name: 'reports a class without extends, an error class, a written undefined and an enum in a .ts and a .tsx file of each non-UI layer, and passes an extending class and an error type alias',
    // The .tsx canary has a base name of its own: typescript-eslint's project service does not find a .tsx file that sits beside a .ts file of the same name.
    paths: nonUiLayers.flatMap((layer) => [
      canaryPath(layer, 'syntax.ts'),
      canaryPath(layer, 'syntaxInTsx.tsx'),
    ]),
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
    name: 'reports a class without extends, the raw React types, a type="text" input and an enum under src/, and passes the project aliases, other inputs, a try/catch and a written undefined',
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
      tryCatchLine,
      undefinedLine,
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
    name: 'reports a try/catch beside the src/ bans in the data access layer and in screens, and passes a try with only a finally',
    paths: noTryCatchLayers.map((layer) => canaryPath(layer, 'syntax.tsx')),
    banned: [
      tryCatchLine,
      classLine,
      rawReactTypeLine,
      textInputLine,
      enumLine,
    ],
    allowedPaths: noTryCatchLayers.map((layer) =>
      canaryPath(layer, 'allowedSyntax.tsx'),
    ),
    allowed: [extendingClassLine, tryFinallyLine],
  },
  {
    name: 'reports export * in the two grouping barrels under src/ beside the bans of their layer, and passes a named re-export',
    paths: srcGroupingBarrels,
    banned: [
      "export * from './canary';",
      tryCatchLine,
      classLine,
      rawReactTypeLine,
      enumLine,
    ],
    allowedPaths: srcGroupingBarrels,
    allowed: ["export { canary } from './canary';"],
    asText: true,
  },
  {
    name: 'reports a string toThrow, a raw React type, a type="text" input and an enum in a test under src/, under types/, the data access layer and screens too, and passes a class without extends and a try/catch there',
    paths: srcTestRoots.map((root) =>
      canaryPath(root, '__tests__', 'syntax.tsx'),
    ),
    banned: [looseToThrowLine, rawReactTypeLine, textInputLine, enumLine],
    allowedPaths: srcTestRoots.map((root) =>
      canaryPath(root, '__tests__', 'allowedSyntax.tsx'),
    ),
    allowed: [classLine, tryCatchLine],
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

/** @param {string[]} specifiers */
const valueImportsOf = (...specifiers) =>
  specifiers.map(
    (specifier, index) =>
      `import { value${String(index)} } from '${specifier}';`,
  );

/**
 * @param {string} name @param {string} layer @param {string[]} banned @param {string[]} allowed
 * @returns {CanaryScope}
 */
const layerScope = (name, layer, banned, allowed) => ({
  name,
  paths: [canaryPath(layer, 'restrictedImports.ts')],
  banned,
  allowedPaths: [canaryPath(layer, 'allowedImports.ts')],
  allowed,
});

const typeOnlyDbImport = "import type { Row } from '@db/session';";

/** @type {CanaryScope[]} */
const layerImportScopes = [
  layerScope(
    'reports a Tauri import and a value import from any later layer in domain/, by alias and by relative path, and passes a type-only import and one from domain/ itself',
    'domain',
    [
      tauriValueImport,
      ...valueImportsOf(
        '@platform',
        '@db/session',
        '@services/sessionService',
        '@/types/fcProps.type',
        '../../platform',
        '../../db',
        '../../services/sessionService',
        '../../src/util',
      ),
    ],
    [
      typeOnlyDbImport,
      "import { type Service } from '../../services/sessionService';",
      ...valueImportsOf('@domain/adventures', '../adventures'),
    ],
  ),
  layerScope(
    'reports a value import from domain/ or any later layer in platform/, by alias and by relative path, and passes a type-only import and a Tauri import',
    'platform',
    valueImportsOf(
      '@domain',
      '@domain/adventures',
      '@db/session',
      '@services/sessionService',
      '@/types/fcProps.type',
      '../../domain',
      '../../db/session',
      '../../services/sessionService',
      '../../src/util',
    ),
    [
      typeOnlyDbImport,
      "import type { AdventureError } from '../../domain/adventures';",
      tauriValueImport,
    ],
  ),
  layerScope(
    'reports a Tauri import and a value import from services/ or src/ in db/, by alias and by relative path, and passes a type-only import and one from an earlier layer or db/util',
    'db',
    [
      tauriValueImport,
      ...valueImportsOf(
        '@services/sessionService',
        '@/types/fcProps.type',
        '../../services/sessionService',
        '../../src/util',
      ),
    ],
    [
      "import type { Service } from '@services/sessionService';",
      ...valueImportsOf('@domain', '@platform', '../util'),
    ],
  ),
  layerScope(
    'reports a Tauri import, any import from react, a type-only one included, and a value import from src/ in services/, by alias and by relative path, and passes a type-only import from src/ and one from an earlier layer',
    'services',
    [
      tauriValueImport,
      "import type { ReactNode } from 'react';",
      ...valueImportsOf('react', '@/types/fcProps.type', '../../src/util'),
    ],
    [
      "import type { FCProps } from '@/types/fcProps.type';",
      ...valueImportsOf('@db/session', '@domain', '@platform'),
    ],
  ),
  layerScope(
    'reports a Tauri import and a value import from a src/ directory above it in the data access layer, by alias and by relative path, and passes src/types/, test support, a type-only import and one from an earlier layer',
    'src/data-access-layer',
    [
      tauriValueImport,
      ...valueImportsOf(
        '@/components/GlassPanel/GlassPanel',
        '@/screens',
        '@/hooks/useListNavigation',
        '@/providers/DeleteDialogProvider',
        '@/routes/__root',
        '@/util/cn',
        '@/App',
        '../../components/GlassPanel/GlassPanel',
        '../../screens',
        '../../hooks/useListNavigation',
        '../../providers/DeleteDialogProvider',
        '../../routes/__root',
        '../../util/cn',
        '../../App',
      ),
    ],
    [
      "import type { Props } from '@/components/GlassPanel/GlassPanel';",
      ...valueImportsOf(
        '@/types/fcProps.type',
        '@/__tests__/support/buildBaseEntity',
        '@services/sessionService',
        '@db/session',
        '@domain',
        '../base-entities',
      ),
    ],
  ),
];

/** @param {string[]} lines */
const sourceOf = (lines) => `${lines.join('\n')}\n`;

/** @type {[string, string][]} */
const scopeCanaryFiles = [...syntaxScopes, ...layerImportScopes]
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
  'src',
  'services',
  'platform',
  'db',
  'domain',
  'util',
  'dev-data-server',
  'services/__tests__',
  'src/data-access-layer',
  'src/screens',
  'src/types',
].map((root) => canaryPath(root));

const eslint = new ESLint({ cwd: appDir });

/** @type {Map<string, import('eslint').Linter.LintMessage[]>} */
const messagesByPath = new Map();

beforeAll(async () => {
  fs.mkdirSync(path.join(srcCanaryDir, 'hooks'), { recursive: true });
  fs.mkdirSync(path.join(srcCanaryDir, '__tests__'), { recursive: true });
  fs.mkdirSync(platformCanaryDir, { recursive: true });
  for (const [filePath, source] of scopeCanaryFiles) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source);
  }
  fs.writeFileSync(componentPath, useContextSource);
  fs.writeFileSync(readerHookPath, useContextSource);
  fs.writeFileSync(hooksFolderPath, useContextSource);
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

/**
 * Checks that the rule reports every banned line of a scope and no allowed one.
 * @param {CanaryScope} scope @param {string} ruleId
 */
const expectScopeReports = async (scope, ruleId) => {
  /** @param {string} filePath @param {string[]} lines */
  const reportedLines = async (filePath, lines) => {
    if (!scope.asText) return linesReportedBy(filePath, ruleId);
    const [result] = await eslint.lintText(sourceOf(lines), { filePath });
    return linesIn(result?.messages ?? null, ruleId);
  };
  const everyBannedLine = scope.banned.map((_, index) => index + 1);
  for (const filePath of scope.paths) {
    expect(await reportedLines(filePath, scope.banned), filePath).toEqual(
      everyBannedLine,
    );
  }
  for (const filePath of scope.allowedPaths) {
    expect(await reportedLines(filePath, scope.allowed), filePath).toEqual([]);
  }
};

/** @param {CanaryScope[]} scopes */
const titled = (scopes) =>
  scopes.map((scope) => /** @type {const} */ ([scope.name, scope]));

describe('the syntax selectors of each scope under the project eslint.config.js', () => {
  it.each(titled(syntaxScopes))(
    '%s',
    (_name, scope) => expectScopeReports(scope, 'no-restricted-syntax'),
    120_000,
  );
});

describe('the layer order import restrictions under the project eslint.config.js', () => {
  it.each(titled(layerImportScopes))(
    '%s',
    (_name, scope) =>
      expectScopeReports(scope, '@typescript-eslint/no-restricted-imports'),
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
  it('report a RegExp not ending in $ in a test file and pass an anchored RegExp, no argument and an error class', () => {
    expect(linesReportedBy(srcToThrowTestPath, 'no-restricted-syntax')).toEqual(
      [7],
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
