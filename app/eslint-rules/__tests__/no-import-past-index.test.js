// @ts-check
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Linter } from 'eslint';
import ts from 'typescript';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import rule, {
  findCrossedBoundary,
  isBoundaryDir,
} from '../no-import-past-index.js';

/** @param {string[]} dirs */
const boundariesAt = (dirs) => {
  const boundaries = new Set(dirs);
  /** @param {string} dir */
  return (dir) => boundaries.has(dir);
};

describe('findCrossedBoundary', () => {
  it('returns null when the importer is inside the boundary folder', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/components/Header/Header.tsx',
        targetPath: '/app/src/components/Header/helper/buildBreadcrumbs.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });

  it("returns null when the target is the boundary's own index.ts", () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/Header/index.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });

  it('returns the boundary when the target is a non-index file behind it', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/Header/helper/buildBreadcrumbs.ts',
        isBoundary: boundariesAt(['/app/src/components/Header']),
        passThroughDirs: [],
      }),
    ).toBe('/app/src/components/Header');
  });

  it("returns the outermost crossed boundary when the target is a nested module's index.ts", () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/data-access-layer/sessions/index.ts',
        isBoundary: boundariesAt([
          '/app/src/data-access-layer',
          '/app/src/data-access-layer/sessions',
        ]),
        passThroughDirs: [],
      }),
    ).toBe('/app/src/data-access-layer');
  });

  it('skips a pass-through folder but enforces the boundaries nested inside it', () => {
    const isBoundary = boundariesAt([
      '/app/domain',
      '/app/domain/sessions',
      '/app/domain/devices',
    ]);
    const passThroughDirs = ['/app/domain'];

    expect(
      findCrossedBoundary({
        importerPath: '/app/services/sessionService.ts',
        targetPath: '/app/domain/sessions/index.ts',
        isBoundary,
        passThroughDirs,
      }),
    ).toBeNull();
    expect(
      findCrossedBoundary({
        importerPath: '/app/domain/sync/messages.ts',
        targetPath: '/app/domain/devices/messages.ts',
        isBoundary,
        passThroughDirs,
      }),
    ).toBe('/app/domain/devices');
  });

  it('ends the walk at the filesystem root when the importer and the target share no folder but it', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/elsewhere/Importer.tsx',
        targetPath: '/app/src/components/Header/helper/buildBreadcrumbs.ts',
        isBoundary: boundariesAt(['/app/src/components/Header', '/app/src']),
        passThroughDirs: [],
      }),
    ).toBe('/app/src');
  });

  it('treats a folder without an index.ts as no boundary', () => {
    expect(
      findCrossedBoundary({
        importerPath: '/app/src/screens/session/SessionScreen.tsx',
        targetPath: '/app/src/components/GlassPanel/GlassPanel.tsx',
        isBoundary: boundariesAt([]),
        passThroughDirs: [],
      }),
    ).toBeNull();
  });
});

describe('isBoundaryDir', () => {
  it('isBoundaryDir recognizes index.ts but not index.tsx', () => {
    const files = new Set([
      '/app/src/routes/index.tsx',
      '/app/src/components/Header/index.ts',
    ]);
    /** @param {string} filePath */
    const fileExists = (filePath) => files.has(filePath);

    expect(isBoundaryDir('/app/src/routes', fileExists)).toBe(false);
    expect(isBoundaryDir('/app/src/components/Header', fileExists)).toBe(true);
  });
});

describe('rule', () => {
  /** @type {string} */
  let root;

  /** @param {string} relativePath @param {string} [content] */
  const write = (relativePath, content = 'export {};\n') => {
    const file = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };

  beforeEach(() => {
    root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'past-index-')),
    );
    write('src/importer.ts');
    write('src/mod/index.ts');
    write('src/mod/inner.ts');
    write('src/mod/other.ts');
    write('src/plain/file.ts');
    write(
      'node_modules/ext/package.json',
      '{"name":"ext","main":"lib/inner.ts"}',
    );
    write('node_modules/ext/index.ts');
    write('node_modules/ext/lib/inner.ts');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  });

  /**
   * Runs the rule's visitors over one import-like node the way ESLint would, for a file `src/importer.ts` of the fixture tree.
   * @param {Record<string, any>} node
   * @param {string} visitor
   * @param {{ options?: any[], parserServices?: any }} [setup]
   */
  const run = (node, visitor, { options = [], parserServices } = {}) => {
    /** @type {any[]} */
    const reports = [];
    const handlers = /** @type {Record<string, (node: any) => void>} */ (
      rule.create(
        /** @type {any} */ ({
          sourceCode: {
            parserServices: parserServices ?? {
              program: {
                getCompilerOptions: () => ({
                  moduleResolution: ts.ModuleResolutionKind.Bundler,
                }),
              },
            },
          },
          options,
          filename: path.join(root, 'src/importer.ts'),
          cwd: root,
          report: (/** @type {any} */ report) => reports.push(report),
        }),
      )
    );
    handlers[visitor](node);
    return reports;
  };

  /** @param {string} value */
  const literal = (value) => ({ type: 'Literal', value });

  it('reports a specifier that reaches behind a folder with an index.ts, naming the specifier and the boundary', () => {
    const reports = run(
      { source: literal('./mod/inner') },
      'ImportDeclaration',
    );

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({
      messageId: 'pastIndex',
      node: literal('./mod/inner'),
      data: { specifier: './mod/inner', boundary: path.join('src', 'mod') },
    });
  });

  it('words the report with the specifier and the folder of the index.ts to import', () => {
    const [report] = run(
      { source: literal('./mod/inner') },
      'ImportDeclaration',
    );
    const template = rule.meta?.messages?.[report.messageId] ?? '';

    expect(
      template.replace(
        /\{\{(\w+)\}\}/g,
        (/** @type {string} */ _match, /** @type {string} */ key) =>
          report.data[key],
      ),
    ).toBe(
      `'./mod/inner' reaches past ${path.join('src', 'mod')}/index.ts. Import from that index.ts instead.`,
    );
  });

  it.each([
    'ImportDeclaration',
    'ExportNamedDeclaration',
    'ExportAllDeclaration',
    'ImportExpression',
  ])('checks the source of a %s', (visitor) => {
    expect(run({ source: literal('./mod/inner') }, visitor)).toHaveLength(1);
    expect(run({ source: literal('./mod') }, visitor)).toEqual([]);
  });

  it.each([
    ['a missing source, as in `export { a }`', null],
    ['an undefined source', undefined],
    [
      'a source that is not a literal',
      { type: 'Identifier', name: 'specifier' },
    ],
    ['a literal that is not a string', { type: 'Literal', value: 42 }],
  ])('reports nothing for %s', (_name, source) => {
    expect(run({ source }, 'ImportDeclaration')).toEqual([]);
    expect(run({ source }, 'ImportExpression')).toEqual([]);
  });

  it('reports nothing for a specifier that resolves to no file', () => {
    expect(
      run({ source: literal('./missing/inner') }, 'ImportDeclaration'),
    ).toEqual([]);
  });

  it('reports nothing for an import of a folder without an index.ts, and of the index.ts itself', () => {
    expect(
      run({ source: literal('./plain/file') }, 'ImportDeclaration'),
    ).toEqual([]);
    expect(
      run({ source: literal('./mod/index') }, 'ImportDeclaration'),
    ).toEqual([]);
  });

  it('reports nothing for a package under node_modules, whatever boundary it holds', () => {
    expect(run({ source: literal('ext') }, 'ImportDeclaration')).toEqual([]);
  });

  it('skips a pass-through folder named by the passThroughDirs option', () => {
    const options = [{ passThroughDirs: [path.join(root, 'src', 'mod')] }];

    expect(
      run({ source: literal('./mod/inner') }, 'ImportDeclaration', { options }),
    ).toEqual([]);
    expect(
      run({ source: literal('./mod/inner') }, 'ImportDeclaration', {
        options: [{}],
      }),
    ).toHaveLength(1);
  });

  it('returns no visitors when the file is not parsed with type information', () => {
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: {} },
          options: [],
        }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: undefined },
          options: [],
        }),
      ),
    ).toEqual({});
  });

  it('asks the file system once per folder, however many imports cross it', () => {
    const existsSync = vi.spyOn(fs, 'existsSync');
    const indexOfMod = path.join(root, 'src', 'mod', 'index.ts');
    // One rule instance, as ESLint creates one per file.
    /** @type {any[]} */
    const reports = [];
    const handlers = /** @type {Record<string, (node: any) => void>} */ (
      rule.create(
        /** @type {any} */ ({
          sourceCode: {
            parserServices: {
              program: {
                getCompilerOptions: () => ({
                  moduleResolution: ts.ModuleResolutionKind.Bundler,
                }),
              },
            },
          },
          options: [],
          filename: path.join(root, 'src/importer.ts'),
          cwd: root,
          report: (/** @type {any} */ report) => reports.push(report),
        }),
      )
    );

    handlers.ImportDeclaration({ source: literal('./mod/inner') });
    handlers.ImportDeclaration({ source: literal('./mod/other') });

    expect(reports).toHaveLength(2);
    expect(
      existsSync.mock.calls.filter(([file]) => file === indexOfMod),
    ).toHaveLength(1);
  });

  describe('options schema', () => {
    /** @param {unknown} option */
    const lintWith = (option) =>
      new Linter().verify('', [
        {
          plugins: { local: { rules: { 'no-import-past-index': rule } } },
          rules: { 'local/no-import-past-index': ['error', option] },
        },
      ]);

    it('accepts an object with a list of strings as passThroughDirs, or no property', () => {
      expect(() =>
        lintWith({ passThroughDirs: ['/app/domain'] }),
      ).not.toThrow();
      expect(() => lintWith({})).not.toThrow();
    });

    const KEY = 'Key "rules": Key "local/no-import-past-index":\n\t';

    it.each([
      [
        'a string instead of an object',
        'domain',
        'Value "domain" should be object.\n',
      ],
      [
        'an unknown property',
        { passThrough: [] },
        'Value {"passThrough":[]} should NOT have additional properties.\n\t\tUnexpected property "passThrough". Expected properties: "passThroughDirs".\n',
      ],
      [
        'passThroughDirs that is not a list',
        { passThroughDirs: '/app/domain' },
        'Value "/app/domain" should be array.\n',
      ],
      [
        'a list holding a non-string',
        { passThroughDirs: [1] },
        'Value 1 should be string.\n',
      ],
    ])('rejects %s', (_name, option, problem) => {
      expect(() => lintWith(option)).toThrow(new Error(KEY + problem));
    });
  });
});
