// @vitest-environment node

// @ts-check
import { describe, expect, it } from 'vitest';
import { createProgramFor, lintInMemory } from './lintInMemory.js';

/** @type {import('eslint').Rule.RuleModule} */
const reportTypes = {
  meta: {
    schema: [{ type: 'object' }],
    messages: { seen: '{{text}}' },
  },
  create(context) {
    const services = /** @type {any} */ (context.sourceCode.parserServices);
    const checker = services.program.getTypeChecker();
    return {
      VariableDeclarator: (node) => {
        const type = checker.getTypeAtLocation(
          services.esTreeNodeToTSNodeMap.get(node.id),
        );
        context.report({
          node,
          messageId: 'seen',
          data: {
            text: `${checker.typeToString(type)} ${JSON.stringify(context.options)}`,
          },
        });
      },
    };
  },
};

describe('lintInMemory', () => {
  it('runs the rule over the named file with the types of the whole in-memory project, resolved through its relative imports', () => {
    const messages = lintInMemory({
      rule: reportTypes,
      files: {
        '/p/types.ts': 'export type Label = "a" | "b";',
        '/p/a.ts':
          "import type { Label } from './types';\nconst x: Label = 'a';\nconst list = [1];\nexport { x, list };\n",
      },
      filename: '/p/a.ts',
    });

    expect(messages.map(({ message, line }) => [line, message])).toEqual([
      [2, 'Label []'],
      [3, 'number[] []'],
    ]);
  });

  it('hands the options to the rule and validates them against its schema', () => {
    const files = { '/p/a.ts': 'const x = 1;\nexport { x };\n' };

    expect(
      lintInMemory({
        rule: reportTypes,
        files,
        filename: '/p/a.ts',
        options: [{ mode: 'strict' }],
      }).map(({ message }) => message),
    ).toEqual(['1 [{"mode":"strict"}]']);
    expect(() =>
      lintInMemory({
        rule: reportTypes,
        files,
        filename: '/p/a.ts',
        options: ['strict'],
      }),
    ).toThrow(
      new Error(
        'Key "rules": Key "local/rule-under-test":\n\tValue "strict" should be object.\n',
      ),
    );
  });

  it('reports a file that does not parse as one fatal message', () => {
    const messages = lintInMemory({
      rule: reportTypes,
      files: { '/p/a.ts': 'const = ;\n' },
      filename: '/p/a.ts',
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].fatal).toBe(true);
  });

  it('lints several files against one shared program when it is given', () => {
    const files = {
      '/p/a.ts': 'export const a = 1;\n',
      '/p/b.ts': 'export const b = 2;\n',
    };
    const program = createProgramFor(files);
    /** @type {unknown[]} */
    const seen = [];
    /** @type {import('eslint').Rule.RuleModule} */
    const recordProgram = {
      create(context) {
        seen.push(
          /** @type {any} */ (context.sourceCode.parserServices).program,
        );
        return {};
      },
    };

    lintInMemory({ rule: recordProgram, files, filename: '/p/a.ts', program });
    lintInMemory({ rule: recordProgram, files, filename: '/p/b.ts', program });

    expect(seen).toEqual([program, program]);
    expect(seen[0]).toBe(program);
  });
});
