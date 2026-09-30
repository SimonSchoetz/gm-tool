// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/**
 * @param {string} dir absolute folder path
 * @param {(filePath: string) => boolean} fileExists
 * @returns {boolean} whether `dir` holds an `index.ts`, which makes it a module boundary
 */
export const isBoundaryDir = (dir, fileExists) =>
  fileExists(path.join(dir, 'index.ts'));

/**
 * Walks from the target's folder up to the first folder that also contains the importer, and returns the outermost boundary folder passed on the way whose `index.ts` is not the target itself.
 * @param {{ importerPath: string, targetPath: string, isBoundary: (dir: string) => boolean, passThroughDirs: string[] }} args all paths absolute
 * @returns {string | null} the outermost crossed boundary folder, or `null` when the import crosses none
 */
export const findCrossedBoundary = ({
  importerPath,
  targetPath,
  isBoundary,
  passThroughDirs,
}) => {
  /** @type {string | null} */
  let outermostCrossing = null;
  let dir = path.dirname(targetPath);

  while (
    !importerPath.startsWith(dir + path.sep) &&
    dir !== path.dirname(dir)
  ) {
    if (
      isBoundary(dir) &&
      !passThroughDirs.includes(dir) &&
      targetPath !== path.join(dir, 'index.ts')
    ) {
      outermostCrossing = dir;
    }
    dir = path.dirname(dir);
  }

  return outermostCrossing;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing a file behind another folder's index.ts; import that index.ts instead.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          passThroughDirs: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      pastIndex:
        "'{{specifier}}' reaches past {{boundary}}/index.ts. Import from that index.ts instead.",
    },
  },
  create(context) {
    /** @type {import('typescript').Program | null | undefined} */
    const program = context.sourceCode.parserServices?.program;
    if (!program) {
      return {};
    }

    const compilerOptions = program.getCompilerOptions();
    /** @type {{ passThroughDirs?: string[] }} */
    const options = context.options[0] ?? {};
    const passThroughDirs = options.passThroughDirs ?? [];

    /** @type {Map<string, boolean>} */
    const boundaryCache = new Map();
    /** @param {string} dir */
    const isBoundary = (dir) => {
      const cached = boundaryCache.get(dir);
      if (cached !== undefined) {
        return cached;
      }
      const result = isBoundaryDir(dir, fs.existsSync);
      boundaryCache.set(dir, result);
      return result;
    };

    /** @param {import('estree').Node | null | undefined} source */
    const check = (source) => {
      if (source?.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const specifier = source.value;
      const { resolvedModule } = ts.resolveModuleName(
        specifier,
        context.filename,
        compilerOptions,
        ts.sys,
      );
      if (!resolvedModule || resolvedModule.isExternalLibraryImport) {
        return;
      }

      const boundary = findCrossedBoundary({
        importerPath: context.filename,
        targetPath: resolvedModule.resolvedFileName,
        isBoundary,
        passThroughDirs,
      });
      if (boundary !== null) {
        context.report({
          node: source,
          messageId: 'pastIndex',
          data: { specifier, boundary: path.relative(context.cwd, boundary) },
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
