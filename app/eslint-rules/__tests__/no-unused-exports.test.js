// @vitest-environment node

// @ts-check
import path from 'node:path';
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import {
  buildUsageIndex,
  isExportUsed,
  localExportsOf,
} from '../no-unused-exports.js';

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

  it('lists an interface and the names of type-only specifiers', () => {
    expect(
      namesIn(
        'export interface I { k: number } const v = 1; type V = number; type W = number; export type { V }; export { v, type W };',
      ),
    ).toEqual(['I', 'V', 'v', 'W']);
  });
});
