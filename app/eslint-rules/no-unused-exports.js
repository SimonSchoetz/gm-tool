// @ts-check
import path from 'node:path';
import ts from 'typescript';

/**
 * A node of the ESTree AST ESLint hands a rule.
 * @typedef {{ type: string } & Record<string, any>} AstNode
 */

/**
 * A re-export statement in a barrel: `export * from`, `export * as name from`, or `export { a as b } from`, keyed by the exported names it carries on from the target file.
 * @typedef {{ barrel: string, kind: 'star' } | { barrel: string, kind: 'namespace', exportedAs: string } | { barrel: string, kind: 'named', exportedAs: Map<string, string> }} Reexport
 */

/**
 * `imported` maps a file to the export names other files import from it directly; `reexports` maps a file to the barrel statements that carry its exports on under the barrel's own name.
 * @typedef {{ imported: Map<string, Set<string>>, reexports: Map<string, Reexport[]> }} UsageIndex
 */

/** Marks every export of a file as used: a namespace import handed around whole, a dynamic `import()`, or an `import()` type. */
export const EVERY_EXPORT = '*';

/** @param {string} filePath */
export const toPosix = (filePath) => filePath.split(path.sep).join('/');

/**
 * Every test file of this repository, and every helper only tests load, lives under a `__tests__/` directory.
 * @param {string} posixPath
 */
export const isTestFile = (posixPath) => posixPath.includes('/__tests__/');

/**
 * @param {readonly import('typescript').SourceFile[]} sourceFiles the files whose imports count as uses
 * @param {(specifier: string, importerPath: string) => string | null} resolve maps a module specifier to the absolute path of the file it names, or `null` for an external or unresolved module
 * @returns {UsageIndex}
 */
export const buildUsageIndex = (sourceFiles, resolve) => {
  /** @type {UsageIndex} */
  const index = { imported: new Map(), reexports: new Map() };

  /** @param {string} target @param {string} name */
  const markImported = (target, name) => {
    const names = index.imported.get(target);
    if (names) {
      names.add(name);
    } else {
      index.imported.set(target, new Set([name]));
    }
  };
  /** @param {string} target @param {Reexport} reexport */
  const addReexport = (target, reexport) => {
    const reexports = index.reexports.get(target);
    if (reexports) {
      reexports.push(reexport);
    } else {
      index.reexports.set(target, [reexport]);
    }
  };

  for (const sourceFile of sourceFiles) {
    const importer = toPosix(sourceFile.fileName);
    /** @param {string} specifier @returns {string | null} the target file, or `null` for an external module or the importer itself */
    const resolveFrom = (specifier) => {
      const target = resolve(specifier, sourceFile.fileName);
      if (target === null) {
        return null;
      }
      const posixTarget = toPosix(target);
      return posixTarget === importer ? null : posixTarget;
    };
    /** @type {Map<string, string>} namespace binding name → the file it imports */
    const namespaces = new Map();

    for (const statement of sourceFile.statements) {
      if (
        ts.isImportDeclaration(statement) &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const target = resolveFrom(statement.moduleSpecifier.text);
        const clause = statement.importClause;
        if (target === null || !clause) {
          continue;
        }
        if (clause.name) {
          markImported(target, 'default');
        }
        const bindings = clause.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const element of bindings.elements) {
            markImported(target, (element.propertyName ?? element.name).text);
          }
        } else if (bindings && ts.isNamespaceImport(bindings)) {
          namespaces.set(bindings.name.text, target);
        }
      } else if (
        ts.isExportDeclaration(statement) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        const target = resolveFrom(statement.moduleSpecifier.text);
        if (target === null) {
          continue;
        }
        const clause = statement.exportClause;
        if (!clause) {
          addReexport(target, { barrel: importer, kind: 'star' });
        } else if (ts.isNamespaceExport(clause)) {
          addReexport(target, {
            barrel: importer,
            kind: 'namespace',
            exportedAs: clause.name.text,
          });
        } else {
          addReexport(target, {
            barrel: importer,
            kind: 'named',
            exportedAs: new Map(
              clause.elements.map((element) => [
                (element.propertyName ?? element.name).text,
                element.name.text,
              ]),
            ),
          });
        }
      }
    }

    /**
     * One walk per file for the uses no statement-level scan sees: dynamic imports, `import()` types, and what a namespace import's members are.
     * @param {import('typescript').Node} node
     * @param {import('typescript').Node} parent
     */
    const visit = (node, parent) => {
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword
      ) {
        const [argument] = node.arguments;
        if (argument && ts.isStringLiteralLike(argument)) {
          const target = resolveFrom(argument.text);
          if (target !== null) {
            markImported(target, EVERY_EXPORT);
          }
        }
      } else if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      ) {
        const target = resolveFrom(node.argument.literal.text);
        if (target !== null) {
          markImported(target, EVERY_EXPORT);
        }
      } else if (ts.isIdentifier(node) && namespaces.has(node.text)) {
        const target = /** @type {string} */ (namespaces.get(node.text));
        if (
          ts.isPropertyAccessExpression(parent) &&
          parent.expression === node
        ) {
          markImported(target, parent.name.text);
        } else if (ts.isQualifiedName(parent) && parent.left === node) {
          markImported(target, parent.right.text);
        } else if (
          ts.isElementAccessExpression(parent) &&
          ts.isStringLiteralLike(parent.argumentExpression)
        ) {
          markImported(target, parent.argumentExpression.text);
        } else if (!ts.isNamespaceImport(parent)) {
          markImported(target, EVERY_EXPORT);
        }
      }
      ts.forEachChild(node, (child) => {
        visit(child, node);
      });
    };
    visit(sourceFile, sourceFile);
  }

  return index;
};

/**
 * @param {Reexport} reexport
 * @param {string} exportName a name exported by the file `reexport` re-exports from
 * @returns {string | null} the name the barrel carries that export on under, or `null` when it does not carry it (a star never carries `default`)
 */
const nameAtBarrelOf = (reexport, exportName) => {
  if (reexport.kind === 'star') {
    return exportName === 'default' ? null : exportName;
  }
  if (reexport.kind === 'namespace') {
    return reexport.exportedAs;
  }
  return reexport.exportedAs.get(exportName) ?? null;
};

/**
 * @param {string} filePath posix path of the exporting file
 * @param {string} exportName
 * @param {UsageIndex} index
 * @param {Set<string>} [visited] barrel-and-name pairs already followed, so a re-export cycle ends
 * @returns {boolean} whether some file imports the export, directly or through any chain of barrels
 */
export const isExportUsed = (
  filePath,
  exportName,
  index,
  visited = new Set(),
) => {
  const direct = index.imported.get(filePath);
  if (
    direct !== undefined &&
    (direct.has(EVERY_EXPORT) || direct.has(exportName))
  ) {
    return true;
  }
  for (const reexport of index.reexports.get(filePath) ?? []) {
    const nameAtBarrel = nameAtBarrelOf(reexport, exportName);
    if (nameAtBarrel === null) {
      continue;
    }
    const key = `${reexport.barrel}\u0000${nameAtBarrel}`;
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);
    if (isExportUsed(reexport.barrel, nameAtBarrel, index, visited)) {
      return true;
    }
  }
  return false;
};

/**
 * @param {AstNode} pattern a binding pattern or identifier
 * @returns {AstNode[]} every identifier the pattern binds
 */
const bindingIdentifiersOf = (pattern) => {
  switch (pattern.type) {
    case 'Identifier':
      return [pattern];
    case 'ObjectPattern':
      return pattern.properties.flatMap((property) =>
        bindingIdentifiersOf(
          property.type === 'RestElement' ? property.argument : property.value,
        ),
      );
    case 'ArrayPattern':
      return pattern.elements.flatMap((element) =>
        element ? bindingIdentifiersOf(element) : [],
      );
    case 'RestElement':
      return bindingIdentifiersOf(pattern.argument);
    case 'AssignmentPattern':
      return bindingIdentifiersOf(pattern.left);
    default:
      return [];
  }
};

/**
 * @param {AstNode} declaration the `declaration` of an `ExportNamedDeclaration`
 * @returns {AstNode[]} the identifiers it declares
 */
const declaredIdentifiersOf = (declaration) => {
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((declarator) =>
      bindingIdentifiersOf(declarator.id),
    );
  }
  return declaration.id.type === 'Identifier' ? [declaration.id] : [];
};

/**
 * @param {AstNode} program the file's ESTree `Program` node
 * @param {(localName: string) => boolean} isImportBinding whether a module-scope name is bound by an import declaration
 * @returns {{ name: string, node: AstNode }[]} every export the file declares itself; re-exports (`export … from` and `export { importedName }`) are left out, since the symbol they forward is reported in its own file
 */
export const localExportsOf = (program, isImportBinding) => {
  /** @type {{ name: string, node: AstNode }[]} */
  const exports = [];
  for (const statement of program.body) {
    if (statement.type === 'ExportDefaultDeclaration') {
      exports.push({ name: 'default', node: statement });
    } else if (
      statement.type === 'ExportNamedDeclaration' &&
      !statement.source
    ) {
      if (statement.declaration) {
        for (const identifier of declaredIdentifiersOf(statement.declaration)) {
          exports.push({ name: identifier.name, node: identifier });
        }
      }
      for (const specifier of statement.specifiers) {
        if (
          specifier.local.type === 'Identifier' &&
          isImportBinding(specifier.local.name)
        ) {
          continue;
        }
        const exported = specifier.exported;
        exports.push({
          name:
            exported.type === 'Identifier'
              ? exported.name
              : String(exported.value),
          node: exported,
        });
      }
    }
  }
  return exports;
};

/**
 * `production` counts only imports from files outside `__tests__/`; `all` counts every file's imports, for the exports test files themselves declare.
 * @typedef {{ production: UsageIndex, all: UsageIndex }} UsageIndexes
 */

/**
 * @param {readonly import('typescript').SourceFile[]} sourceFiles every source file of the program
 * @param {(specifier: string, importerPath: string) => string | null} resolve as for `buildUsageIndex`
 * @returns {UsageIndexes}
 */
export const buildUsageIndexes = (sourceFiles, resolve) => ({
  production: buildUsageIndex(
    sourceFiles.filter(
      (sourceFile) => !isTestFile(toPosix(sourceFile.fileName)),
    ),
    resolve,
  ),
  all: buildUsageIndex(sourceFiles, resolve),
});

/**
 * @param {string} filePath posix path of the exporting file
 * @param {UsageIndexes} indexes
 * @returns {UsageIndex} the index whose imports count as uses of the file's exports: a test file's imports count only for an export a file under `__tests__/` declares, so a production export that only tests import is reported
 */
export const usageIndexFor = (filePath, indexes) =>
  isTestFile(filePath) ? indexes.all : indexes.production;

/** @type {WeakMap<import('typescript').Program, UsageIndexes>} one pair of indexes per program, so a run over the whole project walks every file at most twice */
const indexCache = new WeakMap();

/** @param {import('typescript').Program} program */
const usageIndexOf = (program) => {
  const cached = indexCache.get(program);
  if (cached) {
    return cached;
  }
  const compilerOptions = program.getCompilerOptions();
  const resolutionCache = ts.createModuleResolutionCache(
    program.getCurrentDirectory(),
    ts.sys.useCaseSensitiveFileNames
      ? (fileName) => fileName
      : (fileName) => fileName.toLowerCase(),
    compilerOptions,
  );
  /** @type {(specifier: string, importerPath: string) => string | null} */
  const resolve = (specifier, importerPath) => {
    const { resolvedModule } = ts.resolveModuleName(
      specifier,
      importerPath,
      compilerOptions,
      ts.sys,
      resolutionCache,
    );
    return resolvedModule && !resolvedModule.isExternalLibraryImport
      ? resolvedModule.resolvedFileName
      : null;
  };
  const sourceFiles = program
    .getSourceFiles()
    .filter(
      (sourceFile) =>
        !sourceFile.isDeclarationFile &&
        !sourceFile.fileName.includes('/node_modules/'),
    );
  const indexes = buildUsageIndexes(sourceFiles, resolve);
  indexCache.set(program, indexes);
  return indexes;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow exporting a symbol that no file in the TypeScript program imports, directly or through a barrel; an import from a test file counts only for an export declared under `__tests__/`.',
    },
    schema: [],
    messages: {
      unusedExport:
        "'{{name}}' is exported but no production file imports it. Drop the export keyword, or the symbol itself when nothing in this file uses it either; an export kept only for tests to reach takes `// eslint-disable-next-line local/no-unused-exports -- <reason>`.",
    },
  },
  create(context) {
    /** @type {import('typescript').Program | null | undefined} */
    const program = context.sourceCode.parserServices?.program;
    const filename = toPosix(context.filename);
    if (!program || filename.endsWith('.d.ts')) {
      return {};
    }
    return {
      Program: (node) => {
        const index = usageIndexFor(filename, usageIndexOf(program));
        const scope = context.sourceCode.getScope(node);
        const moduleScope =
          scope.childScopes.find((child) => child.type === 'module') ?? scope;
        /** @param {string} name */
        const isImportBinding = (name) =>
          moduleScope.set
            .get(name)
            ?.defs.some((definition) => definition.type === 'ImportBinding') ??
          false;

        for (const { name, node: exportNode } of localExportsOf(
          node,
          isImportBinding,
        )) {
          if (!isExportUsed(filename, name, index)) {
            context.report({
              node: /** @type {any} */ (
                context.sourceCode.getFirstToken(exportNode)
              ),
              messageId: 'unusedExport',
              data: { name },
            });
          }
        }
      },
    };
  },
};
