// @ts-check
import path from 'node:path';
import ts from 'typescript';

/**
 * A module specifier a file names, and whether loading the file loads that module: `import type` and `export type` are erased before the file runs, so they load nothing.
 * @typedef {{ specifier: string, loadsModule: boolean }} ImportedSpecifier
 */

/** @param {string} filePath */
const toPosix = (filePath) => filePath.split(path.sep).join('/');

/** @param {string} specifier */
const isRelative = (specifier) =>
  specifier.startsWith('./') || specifier.startsWith('../');

/**
 * @param {import('typescript').SourceFile} sourceFile
 * @returns {ImportedSpecifier[]} every specifier of an import declaration, an `export … from` and a dynamic `import()` with a string argument
 */
export const importedSpecifiersOf = (sourceFile) => {
  /** @type {ImportedSpecifier[]} */
  const specifiers = [];
  /** @param {import('typescript').Node} node */
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push({
        specifier: node.moduleSpecifier.text,
        loadsModule: !(node.importClause?.isTypeOnly ?? false),
      });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push({
        specifier: node.moduleSpecifier.text,
        loadsModule: !node.isTypeOnly,
      });
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteralLike(argument)) {
        specifiers.push({ specifier: argument.text, loadsModule: true });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
};

/**
 * Walks the relative imports that load a module, starting from each entry; a type-only import is not followed, since it loads nothing.
 * @param {{ entries: string[], readSourceFile: (filePath: string) => import('typescript').SourceFile | null, resolve: (specifier: string, importerPath: string) => string | null }} args `resolve` maps a relative specifier to the absolute path of the file it names, or `null` when it names none
 * @returns {Set<string>} the posix paths of the entries and of every file they reach
 */
export const collectLoadedFiles = ({ entries, readSourceFile, resolve }) => {
  /** @type {Set<string>} */
  const loaded = new Set();
  const pending = entries.map((entry) => {
    if (readSourceFile(entry) === null) {
      throw new Error(
        `no-extensionless-node-host-import: the entry ${entry} does not exist, so the rule would check nothing.`,
      );
    }
    return toPosix(entry);
  });
  while (pending.length > 0) {
    const filePath = /** @type {string} */ (pending.pop());
    const sourceFile = loaded.has(filePath) ? null : readSourceFile(filePath);
    loaded.add(filePath);
    for (const { specifier, loadsModule } of sourceFile
      ? importedSpecifiersOf(sourceFile)
      : []) {
      const target =
        loadsModule && isRelative(specifier)
          ? resolve(specifier, filePath)
          : null;
      if (target !== null) {
        pending.push(toPosix(target));
      }
    }
  }
  return loaded;
};

/**
 * @param {{ importerPath: string, specifier: string, resolve: (specifier: string, importerPath: string) => string | null }} args `importerPath` is posix, and `resolve` returns a posix path
 * @returns {string | null} the specifier naming, with its extension, the file a relative `specifier` resolves to — `null` when `specifier` already names it, is not relative, or resolves to no file
 */
export const specifierWithExtension = ({
  importerPath,
  specifier,
  resolve,
}) => {
  const targetPath = isRelative(specifier)
    ? resolve(specifier, importerPath)
    : null;
  const importerDir = path.posix.dirname(importerPath);
  if (
    targetPath === null ||
    path.posix.resolve(importerDir, specifier) === targetPath
  ) {
    return null;
  }
  const relative = path.posix.relative(importerDir, targetPath);
  return relative.startsWith('../') ? relative : `./${relative}`;
};

// A relative specifier resolves without the tsconfig's `paths`, so the rule needs no type information and also checks a file linted without it, such as vite.config.ts.
/** @type {import('typescript').CompilerOptions} */
const relativeResolutionOptions = {
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  allowImportingTsExtensions: true,
  noEmit: true,
};

/** @type {(specifier: string, importerPath: string) => string | null} */
const resolveRelative = (specifier, importerPath) => {
  const { resolvedModule } = ts.resolveModuleName(
    specifier,
    importerPath,
    relativeResolutionOptions,
    ts.sys,
  );
  return resolvedModule && !resolvedModule.isExternalLibraryImport
    ? toPosix(resolvedModule.resolvedFileName)
    : null;
};

/** @param {string} filePath */
const readSourceFileFromDisk = (filePath) => {
  const text = ts.sys.readFile(filePath);
  return text === undefined
    ? null
    : ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest);
};

/** @param {string[]} entries */
const walkFromDisk = (entries) =>
  collectLoadedFiles({
    entries,
    readSourceFile: readSourceFileFromDisk,
    resolve: resolveRelative,
  });

/** @type {WeakMap<import('typescript').Program, Map<string, Set<string>>>} one walk per program and entry list, so a run over the whole project reads the reached files once */
const walkCache = new WeakMap();

/**
 * @param {import('typescript').Program | null | undefined} program
 * @param {string[]} entries
 */
const loadedFilesOf = (program, entries) => {
  if (!program) {
    return walkFromDisk(entries);
  }
  const key = entries.join('\u0000');
  const byEntries = walkCache.get(program) ?? new Map();
  walkCache.set(program, byEntries);
  const cached = byEntries.get(key);
  if (cached) {
    return cached;
  }
  const loaded = walkFromDisk(entries);
  byEntries.set(key, loaded);
  return loaded;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require the file extension on every relative import of a file that a host without bundler resolution loads: the files the configured entries reach through imports that load a module.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          entries: { type: 'array', items: { type: 'string' }, minItems: 1 },
        },
        required: ['entries'],
        additionalProperties: false,
      },
    ],
    messages: {
      missingExtension:
        "'{{specifier}}' omits the file extension, which `node` and Vite's native config loader need in a file they load. Import '{{expected}}'.",
    },
  },
  create(context) {
    /** @type {{ entries: string[] }} */
    const { entries } = context.options[0];
    const filename = toPosix(context.filename);
    const loadedFiles = loadedFilesOf(
      context.sourceCode.parserServices?.program,
      entries,
    );
    if (!loadedFiles.has(filename)) {
      return {};
    }

    /** @param {import('estree').Node | null | undefined} source */
    const check = (source) => {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const expected = specifierWithExtension({
        importerPath: filename,
        specifier: source.value,
        resolve: resolveRelative,
      });
      if (expected !== null) {
        context.report({
          node: source,
          messageId: 'missingExtension',
          data: { specifier: source.value, expected },
        });
      }
    };

    return {
      ImportDeclaration: (node) => {
        check(node.source);
      },
      ExportNamedDeclaration: (node) => {
        check(node.source);
      },
      ExportAllDeclaration: (node) => {
        check(node.source);
      },
      ImportExpression: (node) => {
        check(node.source);
      },
    };
  },
};
