// @vitest-environment node

// @ts-check
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Linter } from 'eslint';
import ts from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import rule, {
  collectLoadedFiles,
  importedSpecifiersOf,
  specifierWithExtension,
} from '../no-extensionless-node-host-import.js';
import { lintInMemory } from './support/lintInMemory.js';

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

describe('importedSpecifiersOf, what is no import', () => {
  it('names no specifier for a local export, a call that is not an import(), and an import() of a value that is no string literal', () => {
    expect(
      importedSpecifiersOf(
        sourceFileOf(
          '/p/a.ts',
          [
            'const a = 1;',
            'export { a };',
            'export const b = 2;',
            "require('./required');",
            "fetch('./fetched');",
            'const dynamic = (name: string) => import(name);',
            'const templated = (name: string) => import(`./${name}`);',
            "const quoted = () => import('./quoted');",
          ].join('\n'),
        ),
      ),
    ).toEqual([{ specifier: './quoted', loadsModule: true }]);
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

  it('passes a bare or dotted specifier that happens to name a file beside the importer', () => {
    expect(expectedFor('sibling')).toBe(null);
    expect(expectedFor('dir')).toBe(null);
    expect(expectedFor('.sibling')).toBe(null);
    expect(expectedFor('..sibling')).toBe(null);
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

  /** @param {string} file @param {string[]} entries */
  const lint = (file, entries) =>
    lintInMemory({
      rule,
      files,
      filename: file,
      options: [{ entries }],
    }).map(({ line, column, message }) => [line, column, message]);

  /** @param {string} specifier @param {string} expected */
  const missing = (specifier, expected) =>
    `'${specifier}' omits the file extension, which \`node\` and Vite's native config loader need in a file they load. Import '${expected}'.`;

  beforeEach(() => {
    root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'extensionless-')),
    );
    files = {};
    write('a.ts', 'export const a = 1;\n');
    write('b.ts', 'export const b = 2;\n');
    write('dir/index.ts', 'export const d = 3;\n');
    write('node_modules/pkg/index.ts', 'export const p = 4;\n');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('reports an extensionless relative specifier of every kind of import, naming the file to import', () => {
    write(
      'entry.ts',
      [
        "import { a } from './a';",
        "export { b } from './b';",
        "export * from './dir';",
        "export const lazy = () => import('./a');",
      ].join('\n') + '\n',
    );

    expect(lint(at('entry.ts'), [at('entry.ts')])).toEqual([
      [1, 19, missing('./a', './a.ts')],
      [2, 19, missing('./b', './b.ts')],
      [3, 15, missing('./dir', './dir/index.ts')],
      [4, 34, missing('./a', './a.ts')],
    ]);
  });

  it('reports nothing for a specifier that names its file, a package, a path that resolves to nothing or into node_modules, and an import without a source', () => {
    write(
      'entry.ts',
      [
        "import { a } from './a.ts';",
        "import { dirIndex } from './dir/index.ts';",
        "import { fs } from 'node:fs';",
        "import { gone } from './missing';",
        "import { p } from './node_modules/pkg/index';",
        'const a1 = 1;',
        'export { a1 };',
        'export const lazy = (name: string) => import(name);',
      ].join('\n') + '\n',
    );

    expect(lint(at('entry.ts'), [at('entry.ts')])).toEqual([]);
  });

  it('checks a file the entries reach through imports that load a module, and no other file', () => {
    write(
      'entry.ts',
      "import './reached.ts';\nimport type {} from './typeOnly.ts';\n",
    );
    write('reached.ts', "import { a } from './a';\n");
    write('typeOnly.ts', "import { a } from './a';\n");
    write('unrelated.ts', "import { a } from './a';\n");

    const entries = [at('entry.ts')];

    expect(lint(at('reached.ts'), entries)).toEqual([
      [1, 19, missing('./a', './a.ts')],
    ]);
    expect(lint(at('typeOnly.ts'), entries)).toEqual([]);
    expect(lint(at('unrelated.ts'), entries)).toEqual([]);
  });

  it('checks a file linted without type information, such as a JavaScript config', () => {
    write('config.js', "import { b } from './b';\n");

    const messages = new Linter({ cwd: root }).verify(
      files[at('config.js')],
      [
        {
          files: ['**/*.js'],
          languageOptions: { sourceType: 'module' },
          plugins: { local: { rules: { 'rule-under-test': rule } } },
          rules: {
            'local/rule-under-test': ['error', { entries: [at('config.js')] }],
          },
        },
      ],
      { filename: at('config.js') },
    );

    expect(messages.map(({ message }) => message)).toEqual([
      missing('./b', './b.ts'),
    ]);
  });

  it('reports nothing for an import() of a number, and creates no visitors that read a missing parser service', () => {
    write('entry.ts', 'export const lazy = () => import(42 as never);\n');

    expect(lint(at('entry.ts'), [at('entry.ts')])).toEqual([]);
    expect(
      rule.create(
        /** @type {any} */ ({
          options: [{ entries: [at('entry.ts')] }],
          filename: at('entry.ts'),
          sourceCode: { parserServices: undefined },
        }),
      ),
    ).toHaveProperty('ImportDeclaration');
  });

  it('throws when a configured entry does not exist', () => {
    write('entry.ts', 'export {};\n');

    expect(() => lint(at('entry.ts'), [at('gone.ts')])).toThrow(
      new Error(
        `Error while loading rule 'local/rule-under-test': no-extensionless-node-host-import: the entry ${at('gone.ts')} does not exist, so the rule would check nothing.\nOccurred while linting ${at('entry.ts')}`,
      ),
    );
  });

  it('walks the entries once for one program, however many files it lints, and again for other entries', () => {
    write('entry.ts', "import './reached.ts';\n");
    write('reached.ts', 'export {};\n');
    write('other.ts', 'export {};\n');
    const readFile = vi.spyOn(ts.sys, 'readFile');
    const program = {};
    /** @param {string[]} entries */
    const createFor = (entries) =>
      rule.create(
        /** @type {any} */ ({
          options: [{ entries }],
          filename: at('reached.ts'),
          sourceCode: { parserServices: { program } },
        }),
      );
    const readsOfEntry = () =>
      readFile.mock.calls.filter(([file]) => file === at('entry.ts')).length;

    // A walk reads the entry twice: once to check it exists and once to follow its imports.
    createFor([at('entry.ts')]);
    createFor([at('entry.ts')]);

    expect(readsOfEntry()).toBe(2);

    createFor([at('entry.ts'), at('other.ts')]);

    expect(readsOfEntry()).toBe(4);
  });

  it('accepts only an object with a non-empty list of strings as entries', () => {
    write('entry.ts', 'export {};\n');
    const KEY = 'Key "rules": Key "local/rule-under-test":\n\t';
    /** @param {unknown} option */
    const lintWith = (option) =>
      new Linter().verify('', [
        {
          plugins: { local: { rules: { 'rule-under-test': rule } } },
          rules: { 'local/rule-under-test': ['error', option] },
        },
      ]);

    expect(() => lintWith({ entries: [at('entry.ts')] })).not.toThrow();
    expect(() => lintWith('entry.ts')).toThrow(
      new Error(`${KEY}Value "entry.ts" should be object.\n`),
    );
    expect(() => lintWith({})).toThrow(
      new Error(`${KEY}Value {} should have required property 'entries'.\n`),
    );
    expect(() => lintWith({ entries: [] })).toThrow(
      new Error(`${KEY}Value [] should NOT have fewer than 1 items.\n`),
    );
    expect(() => lintWith({ entries: 'entry.ts' })).toThrow(
      new Error(`${KEY}Value "entry.ts" should be array.\n`),
    );
    expect(() => lintWith({ entries: [1] })).toThrow(
      new Error(`${KEY}Value 1 should be string.\n`),
    );
    expect(() => lintWith({ entries: ['a'], other: true })).toThrow(
      new Error(
        `${KEY}Value {"entries":["a"],"other":true} should NOT have additional properties.\n\t\tUnexpected property "other". Expected properties: "entries".\n`,
      ),
    );
  });
});
