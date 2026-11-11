// @vitest-environment node

// @ts-check
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import { Linter } from 'eslint';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import rule, {
  buildUsageIndex,
  buildUsageIndexes,
  isExportUsed,
  isTestFile,
  localExportsOf,
  usageIndexFor,
} from '../no-unused-exports.js';
import { createProgramFor, lintInMemory } from './support/lintInMemory.js';

/**
 * Indexes an in-memory project: `files` maps absolute posix paths to source text, and a relative specifier resolves to `<path>.ts`, `<path>.tsx` or `<path>/index.ts`, whichever exists; a bare specifier is external.
 * @param {Record<string, string>} files
 */
const indexOf = (files) => {
  const sourceFiles = Object.entries(files).map(([fileName, text]) =>
    ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest),
  );
  /** @type {(specifier: string, importerPath: string) => string | null} */
  const resolve = (specifier, importerPath) => {
    if (!specifier.startsWith('.')) {
      return null;
    }
    const base = path.posix.resolve(
      path.posix.dirname(importerPath),
      specifier,
    );
    return (
      [`${base}.ts`, `${base}.tsx`, `${base}/index.ts`].find(
        (candidate) => candidate in files,
      ) ?? null
    );
  };
  return buildUsageIndex(sourceFiles, resolve);
};

describe('isExportUsed with buildUsageIndex', () => {
  it('counts a named import, under its original name when aliased, and nothing else from that file', () => {
    const index = indexOf({
      '/p/a.ts': 'export const a = 1; export const b = 2; export const c = 3;',
      '/p/x.ts': "import { a, b as renamed } from './a';",
    });
    expect(isExportUsed('/p/a.ts', 'a', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'b', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'c', index)).toBe(false);
  });

  it("counts a default import as a use of 'default'", () => {
    const index = indexOf({
      '/p/a.ts': 'export default 1; export const named = 2;',
      '/p/x.ts': "import value from './a';",
    });
    expect(isExportUsed('/p/a.ts', 'default', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'named', index)).toBe(false);
  });

  it('counts only the members a namespace import accesses, in values and in typeof positions', () => {
    const index = indexOf({
      '/p/db.ts':
        'export const create = 1; export const remove = 2; export const get = 3;',
      '/p/x.ts':
        "import * as db from './db'; import type * as dbTypes from './db'; db.create; type T = typeof dbTypes.get;",
    });
    expect(isExportUsed('/p/db.ts', 'create', index)).toBe(true);
    expect(isExportUsed('/p/db.ts', 'get', index)).toBe(true);
    expect(isExportUsed('/p/db.ts', 'remove', index)).toBe(false);
  });

  it('counts every export when a namespace import is handed around whole or indexed dynamically', () => {
    const whole = indexOf({
      '/p/db.ts': 'export const create = 1;',
      '/p/x.ts': "import * as db from './db'; use(db);",
    });
    const dynamicKey = indexOf({
      '/p/db.ts': 'export const create = 1;',
      '/p/x.ts': "import * as db from './db'; db[key];",
    });
    expect(isExportUsed('/p/db.ts', 'create', whole)).toBe(true);
    expect(isExportUsed('/p/db.ts', 'create', dynamicKey)).toBe(true);
  });

  it('counts every export of a dynamically imported file and of an import() type target', () => {
    const index = indexOf({
      '/p/a.ts': 'export const a = 1;',
      '/p/b.ts': 'export const b = 1;',
      '/p/x.ts': "const m = import('./a'); type B = typeof import('./b');",
    });
    expect(isExportUsed('/p/a.ts', 'a', index)).toBe(true);
    expect(isExportUsed('/p/b.ts', 'b', index)).toBe(true);
  });

  it('follows a named re-export in a barrel under the name the barrel gives it', () => {
    const index = indexOf({
      '/p/m/impl.ts': 'export const inner = 1; export const other = 2;',
      '/p/m/index.ts': "export { inner as outer } from './impl';",
      '/p/x.ts': "import { outer } from './m';",
    });
    expect(isExportUsed('/p/m/impl.ts', 'inner', index)).toBe(true);
    expect(isExportUsed('/p/m/impl.ts', 'other', index)).toBe(false);
  });

  it('follows a star re-export chain, but never a default export through a star', () => {
    const index = indexOf({
      '/p/d/s/impl.ts': 'export const deep = 1; export default 2;',
      '/p/d/s/index.ts': "export * from './impl';",
      '/p/d/index.ts': "export * from './s';",
      '/p/x.ts': "import { deep } from './d'; import fallback from './d';",
    });
    expect(isExportUsed('/p/d/s/impl.ts', 'deep', index)).toBe(true);
    expect(isExportUsed('/p/d/s/impl.ts', 'default', index)).toBe(false);
  });

  it('counts every export behind an `export * as` namespace that is imported', () => {
    const index = indexOf({
      '/p/impl.ts': 'export const one = 1; export const two = 2;',
      '/p/index.ts': "export * as impl from './impl';",
      '/p/x.ts': "import { impl } from './index';",
    });
    expect(isExportUsed('/p/impl.ts', 'one', index)).toBe(true);
    expect(isExportUsed('/p/impl.ts', 'two', index)).toBe(true);
  });

  it('ignores a file importing from itself and an import of an external module', () => {
    const index = indexOf({
      '/p/a.ts':
        "import { a } from './a'; import { b } from 'external'; export const a = 1;",
    });
    expect(isExportUsed('/p/a.ts', 'a', index)).toBe(false);
    expect(index.imported.size).toBe(0);
  });

  it('ends on a re-export cycle instead of looping', () => {
    const index = indexOf({
      '/p/a.ts': "export * from './b'; export const a = 1;",
      '/p/b.ts': "export * from './a'; export const b = 2;",
    });
    expect(isExportUsed('/p/a.ts', 'a', index)).toBe(false);
    expect(isExportUsed('/p/b.ts', 'b', index)).toBe(false);
  });
});

describe('isExportUsed with buildUsageIndex, the cases a use is not', () => {
  it('does not count a default use for a named import, and no crash on a local export statement', () => {
    const index = indexOf({
      '/p/a.ts': 'export default 1; export const named = 2;',
      '/p/x.ts':
        "import { named } from './a'; const local = 1; export { local };",
    });

    expect(isExportUsed('/p/a.ts', 'named', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'default', index)).toBe(false);
  });

  it('counts no use for a call that is no import() or an import() of a computed specifier', () => {
    const index = indexOf({
      '/p/a.ts': 'export const a = 1;',
      '/p/b.ts': 'export const b = 1;',
      '/p/x.ts':
        "load('./a'); const dynamic = (name: string) => import(name); const templated = (name: string) => import(`./${name}`);",
    });

    expect(isExportUsed('/p/a.ts', 'a', index)).toBe(false);
    expect(isExportUsed('/p/b.ts', 'b', index)).toBe(false);
  });

  it('follows every barrel that re-exports a file, not only the first', () => {
    const index = indexOf({
      '/p/a.ts': 'export const first = 1; export const second = 2;',
      '/p/viaNamed.ts': "export { first as shown } from './a';",
      '/p/viaStar.ts': "export * from './a';",
      '/p/x.ts': "import { shown } from './viaNamed';",
      '/p/y.ts': "import { second } from './viaStar';",
    });

    expect(isExportUsed('/p/a.ts', 'first', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'second', index)).toBe(true);
  });

  it('does not count a barrel that does not carry the export, even when the barrel is imported whole', () => {
    const index = indexOf({
      '/p/a.ts': 'export const used = 1; export const other = 2;',
      '/p/barrel.ts': "export { other } from './a';",
      '/p/x.ts': "import * as barrel from './barrel'; use(barrel);",
    });

    expect(isExportUsed('/p/a.ts', 'other', index)).toBe(true);
    expect(isExportUsed('/p/a.ts', 'used', index)).toBe(false);
  });

  it('counts a namespace name that is only a property, a qualified right side or an index as a use of every export', () => {
    const property = indexOf({
      '/p/db.ts': 'export const create = 1; export const remove = 2;',
      '/p/x.ts': "import * as db from './db'; holder.db;",
    });
    const qualified = indexOf({
      '/p/db.ts': 'export const create = 1; export const remove = 2;',
      '/p/x.ts': "import * as db from './db'; type T = Holder.db;",
    });
    const indexed = indexOf({
      '/p/db.ts': 'export const create = 1; export const remove = 2;',
      '/p/x.ts': "import * as db from './db'; table[db];",
    });
    const numbered = indexOf({
      '/p/db.ts': 'export const create = 1; export const remove = 2;',
      '/p/x.ts': "import * as db from './db'; db[0];",
    });

    for (const index of [property, qualified, indexed, numbered]) {
      expect(isExportUsed('/p/db.ts', 'create', index)).toBe(true);
      expect(isExportUsed('/p/db.ts', 'remove', index)).toBe(true);
    }
  });

  it('counts only the member a namespace import reads by a string key', () => {
    const index = indexOf({
      '/p/db.ts': 'export const create = 1; export const remove = 2;',
      '/p/x.ts': "import * as db from './db'; db['create'];",
    });

    expect(isExportUsed('/p/db.ts', 'create', index)).toBe(true);
    expect(isExportUsed('/p/db.ts', 'remove', index)).toBe(false);
  });
});

describe('usageIndexFor with buildUsageIndexes', () => {
  /** @param {Record<string, string>} files */
  const indexesOf = (files) =>
    buildUsageIndexes(
      Object.entries(files).map(([fileName, text]) =>
        ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest),
      ),
      (specifier, importerPath) =>
        `${path.posix.resolve(path.posix.dirname(importerPath), specifier)}.ts`,
    );
  /** @param {ReturnType<typeof indexesOf>} indexes @param {string} filePath @param {string} name */
  const isUsed = (indexes, filePath, name) =>
    isExportUsed(filePath, name, usageIndexFor(filePath, indexes));

  it('counts a test import of a production export as no use, and a production import as one', () => {
    const indexes = indexesOf({
      '/p/a.ts': 'export const testOnly = 1; export const used = 2;',
      '/p/b.ts': "import { used } from './a';",
      '/p/__tests__/a.test.ts': "import { testOnly, used } from '../a';",
    });
    expect(isUsed(indexes, '/p/a.ts', 'testOnly')).toBe(false);
    expect(isUsed(indexes, '/p/a.ts', 'used')).toBe(true);
  });

  it('counts a test import of an export declared under __tests__/, and a production import of it too', () => {
    const indexes = indexesOf({
      '/p/__tests__/support/build.ts':
        'export const build = 1; export const shared = 2; export const unused = 3;',
      '/p/__tests__/a.test.ts': "import { build } from './support/build';",
      '/p/a.ts': "import { shared } from './__tests__/support/build';",
    });
    expect(isUsed(indexes, '/p/__tests__/support/build.ts', 'build')).toBe(
      true,
    );
    expect(isUsed(indexes, '/p/__tests__/support/build.ts', 'shared')).toBe(
      true,
    );
    expect(isUsed(indexes, '/p/__tests__/support/build.ts', 'unused')).toBe(
      false,
    );
  });
});

describe('isTestFile', () => {
  it('holds for a path with a __tests__ directory and for no other', () => {
    expect(isTestFile('/p/src/__tests__/a.test.ts')).toBe(true);
    expect(isTestFile('/p/src/__tests__/support/build.ts')).toBe(true);
    expect(isTestFile('/p/src/a.test.ts')).toBe(false);
    expect(isTestFile('/p/src/my__tests__/a.ts')).toBe(false);
  });
});

describe('localExportsOf', () => {
  /** @param {string} code @param {string[]} importBindings */
  const namesIn = (code, importBindings = []) => {
    const { ast } =
      /** @type {{ ast: import('../no-unused-exports.js').AstNode }} */ (
        /** @type {any} */ (tseslint.parser).parseForESLint(code)
      );
    return localExportsOf(ast, (name) => importBindings.includes(name)).map(
      ({ name }) => name,
    );
  };

  it('lists declared values, functions, types and the default export', () => {
    expect(
      namesIn(
        'export const a = 1, b = 2; export function f() {} export type T = string; export default 3;',
      ),
    ).toEqual(['a', 'b', 'f', 'T', 'default']);
  });

  it('lists an export specifier under its exported name, but not one that forwards an import', () => {
    expect(
      namesIn(
        "import { imported } from './m'; const x = 1, y = 2; export { x, y as z, imported };",
        ['imported'],
      ),
    ).toEqual(['x', 'z']);
  });

  it('leaves out re-exports from another module', () => {
    expect(
      namesIn(
        "export * from './m'; export { q } from './m'; export type { R } from './m';",
      ),
    ).toEqual([]);
  });

  it('lists every identifier a destructuring export binds', () => {
    expect(
      namesIn(
        'export const { a, b: c, ...rest } = o; export const [d, , ...e] = arr;',
      ),
    ).toEqual(['a', 'c', 'rest', 'd', 'e']);
  });

  it('lists the identifiers a destructuring export with defaults binds', () => {
    expect(
      namesIn('export const { a = 1 } = o; export const [b = 2] = arr;'),
    ).toEqual(['a', 'b']);
  });

  it('lists a specifier exported under a string name by that name, and no namespace with a dotted name', () => {
    expect(
      namesIn(
        "const a = 1; export { a as 'weird name' }; export namespace Outer.Inner {}",
      ),
    ).toEqual(['weird name']);
  });

  it('lists an interface and the names of type-only specifiers', () => {
    expect(
      namesIn(
        'export interface I { k: number } const v = 1; type V = number; type W = number; export type { V }; export { v, type W };',
      ),
    ).toEqual(['I', 'V', 'v', 'W']);
  });
});

describe('rule', () => {
  /** @type {string} */
  let root;
  /** @type {Record<string, string>} */
  let files;

  /** @param {string} relativePath @param {string} content */
  const write = (relativePath, content) => {
    const file = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    files[file] = content;
  };

  /** @param {string} relativePath */
  const at = (relativePath) => path.join(root, relativePath);

  /** @param {string} relativePath @param {import('typescript').Program} [program] */
  const lint = (relativePath, program) =>
    lintInMemory({ rule, files, filename: at(relativePath), program }).map(
      ({ line, column, message }) => [line, column, message],
    );

  /** @param {string} relativePath the names reported for the file */
  const reported = (relativePath) =>
    lint(relativePath).map(
      ([, , message]) => /^'([^']*)'/.exec(String(message))?.[1],
    );

  /** @param {string} name */
  const unused = (name) =>
    `'${name}' is exported but no production file imports it. Drop the export keyword, or the symbol itself when nothing in this file uses it either; an export kept only for tests to reach takes \`// eslint-disable-next-line local/no-unused-exports -- <reason>\`.`;

  beforeEach(() => {
    root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'unused-exports-')),
    );
    files = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reports an export no file imports, at its name, and none that another file imports', () => {
    write(
      'a.ts',
      'export const used = 1;\nexport const unusedOne = 2;\nexport function unusedTwo() {}\n',
    );
    write('b.ts', "import { used } from './a';\nexport const keep = used;\n");

    expect(lint('a.ts')).toEqual([
      [2, 14, unused('unusedOne')],
      [3, 17, unused('unusedTwo')],
    ]);
  });

  it('reports an unused default export at its export keyword, and none when it is imported', () => {
    write('a.ts', 'export default 1;\n');

    expect(lint('a.ts')).toEqual([[1, 1, unused('default')]]);

    write('b.ts', "import value from './a';\nexport const keep = value;\n");

    expect(lint('a.ts')).toEqual([]);
  });

  it('reports an export of a name no scope of the file declares', () => {
    write('a.ts', 'export { unresolved };\n');

    expect(reported('a.ts')).toEqual(['unresolved']);
  });

  it('reports an unused default export over its export keyword only, and a named one over its name only', () => {
    write('a.ts', 'export default function () {}\nexport const lonely = 1;\n');

    expect(
      lintInMemory({ rule, files, filename: at('a.ts') }).map(
        ({ line, column, endLine, endColumn }) => [
          line,
          column,
          endLine,
          endColumn,
        ],
      ),
    ).toEqual([
      [1, 1, 1, 7],
      [2, 14, 2, 20],
    ]);
  });

  it('reports each unused name of every export shape, and none for a namespace with a dotted name', () => {
    write(
      'a.ts',
      [
        'const local = 1;',
        'const other = 2;',
        'export { local, other as renamed };',
        'export const { destructured, nested: [inner], ...rest } = source;',
        'export class Thing {}',
        'export enum Mode { On }',
        'export interface Shape { k: number }',
        'export type Alias = string;',
        'export namespace Outer.Inner { export const k = 1; }',
        'declare const source: { destructured: 1; nested: [2]; extra: 3 };',
      ].join('\n') + '\n',
    );

    expect(reported('a.ts')).toEqual([
      'local',
      'renamed',
      'destructured',
      'inner',
      'rest',
      'Thing',
      'Mode',
      'Shape',
      'Alias',
    ]);
  });

  it('does not report an export that only forwards an import', () => {
    write('a.ts', 'export const value = 1;\n');
    write('b.ts', "import { value } from './a';\nexport { value };\n");

    expect(reported('b.ts')).toEqual([]);
  });

  it.each([
    ['a named import', "import { used } from './a';"],
    ['an aliased import', "import { used as renamed } from './a';"],
    [
      'a namespace member',
      "import * as a from './a';\nexport const keep = a.used;",
    ],
    [
      'a namespace member by string key',
      "import * as a from './a';\nexport const keep = a['used'];",
    ],
    [
      'a namespace handed around whole',
      "import * as a from './a';\nexport const keep = a;",
    ],
    ['a dynamic import', "export const keep = () => import('./a');"],
    ['an import() type', "export type Keep = typeof import('./a');"],
  ])('counts %s as a use', (_name, importer) => {
    write('a.ts', 'export const used = 1;\n');
    write('b.ts', `${importer}\n`);

    expect(reported('a.ts')).toEqual([]);
  });

  it('counts a use through a chain of barrels, and none through a barrel nobody imports', () => {
    write('a.ts', 'export const used = 1;\nexport const other = 2;\n');
    write('inner/index.ts', "export { used as shown } from '../a';\n");
    write('outer.ts', "export * from './inner';\n");
    write(
      'main.ts',
      "import { shown } from './outer';\nexport const keep = shown;\n",
    );

    expect(reported('a.ts')).toEqual(['other']);
  });

  it('counts a namespace re-export that is imported as a use of every export', () => {
    write('a.ts', 'export const used = 1;\n');
    write('barrel.ts', "export * as lib from './a';\n");

    expect(reported('a.ts')).toEqual(['used']);

    write(
      'main.ts',
      "import { lib } from './barrel';\nexport const keep = lib;\n",
    );

    expect(reported('a.ts')).toEqual([]);
  });

  it('counts no import of a test file for a production export, and counts it for an export declared under __tests__', () => {
    write('a.ts', 'export const used = 1;\n');
    write(
      '__tests__/a.test.ts',
      "import { used } from '../a';\nimport { helper } from './helper';\nexport const keep = [used, helper];\n",
    );
    write('__tests__/helper.ts', 'export const helper = 1;\n');

    expect(reported('a.ts')).toEqual(['used']);
    expect(reported('__tests__/helper.ts')).toEqual([]);
  });

  it('counts no import of a declaration file or a file under node_modules, and none of the file itself', () => {
    write(
      'a.ts',
      "import { used as again } from './a';\nexport const used = 1;\nexport const keep = again;\n",
    );
    write(
      'types.d.ts',
      "import { used } from './a';\nexport declare const seen: typeof used;\n",
    );
    write(
      'node_modules/pkg/index.ts',
      "import { used } from '../../a';\nexport const dep = used;\n",
    );

    expect(reported('a.ts')).toEqual(['used', 'keep']);
  });

  it('resolves the same relative specifier of two folders to their own files', () => {
    write('one/a.ts', 'export const x = 1;\n');
    write(
      'one/user.ts',
      "import { x } from './a';\nexport const keepOne = x;\n",
    );
    write('two/a.ts', 'export const x = 2;\n');
    write(
      'two/user.ts',
      "import { x } from './a';\nexport const keepTwo = x;\n",
    );

    expect(reported('one/a.ts')).toEqual([]);
    expect(reported('two/a.ts')).toEqual([]);
  });

  it('reports nothing for a declaration file, and returns no visitors without a program', () => {
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: { program: {} } },
          filename: '/p/types.d.ts',
        }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: {} },
          filename: '/p/a.ts',
        }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: undefined },
          filename: '/p/a.ts',
        }),
      ),
    ).toEqual({});
  });

  it('builds the usage indexes once per program, however many files it lints', () => {
    write('a.ts', 'export const used = 1;\n');
    write('b.ts', "import { used } from './a';\nexport const keep = used;\n");
    const program = createProgramFor(files);
    // Only the index build reads the program's current directory, for its module resolution cache.
    const buildsOfIndex = vi.spyOn(program, 'getCurrentDirectory');

    lint('a.ts', program);
    lint('b.ts', program);

    expect(buildsOfIndex).toHaveBeenCalledTimes(1);
  });

  it('accepts no option', () => {
    expect(() =>
      new Linter().verify('', [
        {
          plugins: { local: { rules: { 'no-unused-exports': rule } } },
          rules: { 'local/no-unused-exports': ['error', {}] },
        },
      ]),
    ).toThrow(
      new Error(
        'Key "rules": Key "local/no-unused-exports":\n\tValue [{}] should NOT have more than 0 items.\n',
      ),
    );
  });
});
