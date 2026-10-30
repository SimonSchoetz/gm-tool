// @vitest-environment node

// @ts-check
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  collectLoadedFiles,
  importedSpecifiersOf,
  specifierWithExtension,
} from '../no-extensionless-node-host-import.js';

/** @param {string} fileName @param {string} text */
const sourceFileOf = (fileName, text) =>
  ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest);

/**
 * Resolves against an in-memory project: `files` lists absolute posix paths, and a relative specifier resolves to itself, `<path>.ts` or `<path>/index.ts`, whichever exists.
 * @param {string[]} files
 * @returns {(specifier: string, importerPath: string) => string | null}
 */
const resolverOver = (files) => (specifier, importerPath) => {
  const base = path.posix.resolve(path.posix.dirname(importerPath), specifier);
  return (
    [base, `${base}.ts`, `${base}/index.ts`].find((candidate) =>
      files.includes(candidate),
    ) ?? null
  );
};

/** @param {Record<string, string>} files absolute posix path → source text @param {string[]} entries */
const loadedFrom = (files, entries) =>
  [
    ...collectLoadedFiles({
      entries,
      readSourceFile: (filePath) =>
        filePath in files ? sourceFileOf(filePath, files[filePath]) : null,
      resolve: resolverOver(Object.keys(files)),
    }),
  ].sort();

describe('importedSpecifiersOf', () => {
  it('marks an import type and an export type as loading no module, and a value import, an inline type specifier, a re-export and a dynamic import as loading one', () => {
    expect(
      importedSpecifiersOf(
        sourceFileOf(
          '/p/a.ts',
          [
            "import type { T } from './typeOnly';",
            "export type { U } from './typeOnlyReexport';",
            "import { value } from './value';",
            "import { type V } from './inlineType';",
            "import './sideEffect';",
            "export * from './star';",
            "export { named } from './named';",
            "const lazy = () => import('./lazy');",
          ].join('\n'),
        ),
      ),
    ).toEqual([
      { specifier: './typeOnly', loadsModule: false },
      { specifier: './typeOnlyReexport', loadsModule: false },
      { specifier: './value', loadsModule: true },
      { specifier: './inlineType', loadsModule: true },
      { specifier: './sideEffect', loadsModule: true },
      { specifier: './star', loadsModule: true },
      { specifier: './named', loadsModule: true },
      { specifier: './lazy', loadsModule: true },
    ]);
  });
});

describe('collectLoadedFiles', () => {
  it('follows relative imports that load a module through every depth, and directory imports to their index.ts', () => {
    expect(
      loadedFrom(
        {
          '/p/entry.ts': "import { a } from './a.ts'; import 'external';",
          '/p/a.ts': "export * from '../q/dir';",
          '/q/dir/index.ts': "export { b } from './b';",
          '/q/dir/b.ts': "const c = () => import('./c.ts');",
          '/q/dir/c.ts': '',
          '/p/unreached.ts': '',
        },
        ['/p/entry.ts'],
      ),
    ).toEqual([
      '/p/a.ts',
      '/p/entry.ts',
      '/q/dir/b.ts',
      '/q/dir/c.ts',
      '/q/dir/index.ts',
    ]);
  });

  it('does not follow a type-only import or re-export, so a module reached only through one stays out', () => {
    expect(
      loadedFrom(
        {
          '/p/entry.ts':
            "import type { runSeed } from './seed/seed.ts'; export type { T } from './types';",
          '/p/seed/seed.ts': "import { x } from '../services/x';",
          '/p/types.ts': '',
          '/p/services/x.ts': '',
        },
        ['/p/entry.ts'],
      ),
    ).toEqual(['/p/entry.ts']);
  });

  it('collects every entry and ends on an import cycle', () => {
    expect(
      loadedFrom(
        {
          '/p/one.ts': "import './two.ts';",
          '/p/two.ts': "import './one.ts';",
          '/p/other.ts': '',
        },
        ['/p/one.ts', '/p/other.ts'],
      ),
    ).toEqual(['/p/one.ts', '/p/other.ts', '/p/two.ts']);
  });

  it('throws when an entry does not exist, rather than reaching nothing and passing every file', () => {
    expect(() => loadedFrom({}, ['/p/missing.ts'])).toThrow(
      /^no-extensionless-node-host-import: the entry \/p\/missing\.ts does not exist, so the rule would check nothing\.$/,
    );
  });
});

describe('specifierWithExtension', () => {
  const resolve = resolverOver([
    '/p/sibling.ts',
    '/p/dir/index.ts',
    '/q/other.ts',
    '/p/data.json',
  ]);
  /** @param {string} specifier */
  const expectedFor = (specifier) =>
    specifierWithExtension({
      importerPath: '/p/importer.ts',
      specifier,
      resolve,
    });

  it('passes a specifier that already names its file, a non-relative one, and one that resolves to nothing', () => {
    expect(expectedFor('./sibling.ts')).toBe(null);
    expect(expectedFor('./dir/index.ts')).toBe(null);
    expect(expectedFor('../q/other.ts')).toBe(null);
    expect(expectedFor('./data.json')).toBe(null);
    expect(expectedFor('@domain')).toBe(null);
    expect(expectedFor('external')).toBe(null);
    expect(expectedFor('./missing')).toBe(null);
  });

  it('names the file for an extensionless specifier, inside and above the importer folder', () => {
    expect(expectedFor('./sibling')).toBe('./sibling.ts');
    expect(expectedFor('../q/other')).toBe('../q/other.ts');
  });

  it('names the index.ts for a directory import, with or without a trailing slash', () => {
    expect(expectedFor('./dir')).toBe('./dir/index.ts');
    expect(expectedFor('./dir/')).toBe('./dir/index.ts');
  });
});
