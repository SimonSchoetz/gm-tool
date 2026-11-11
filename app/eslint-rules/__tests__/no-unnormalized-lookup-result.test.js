// @vitest-environment node

// @ts-check
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import rule, {
  classifyEscape,
  findValueCarrier,
  lookupMethodOf,
  typeMayBeUndefined,
} from '../no-unnormalized-lookup-result.js';
import { lintInMemory } from './support/lintInMemory.js';

/**
 * @typedef {import('../no-unnormalized-lookup-result.js').AstNode} AstNode
 */

/**
 * Gives every node the `parent` link ESLint adds during traversal.
 * @param {AstNode} node
 * @param {AstNode | null} parent
 */
const attachParents = (node, parent) => {
  node.parent = parent;
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || key === 'loc' || key === 'range') {
      continue;
    }
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (
        child &&
        typeof child === 'object' &&
        typeof child.type === 'string'
      ) {
        attachParents(child, node);
      }
    }
  }
};

/**
 * @param {string} code
 * @returns {AstNode[]} every call `lookupMethodOf` names in `code`, in source order
 */
const lookupCallsIn = (code) => {
  const { ast } = /** @type {{ ast: AstNode }} */ (
    /** @type {any} */ (tseslint.parser).parseForESLint(code, {
      filePath: 'probe.tsx',
      ecmaFeatures: { jsx: true },
    })
  );
  attachParents(ast, null);
  /** @type {AstNode[]} */
  const calls = [];
  /** @param {AstNode} node */
  const collect = (node) => {
    if (lookupMethodOf(node) !== null) {
      calls.push(node);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent') {
        continue;
      }
      const children = Array.isArray(value) ? value : [value];
      for (const child of children) {
        if (
          child &&
          typeof child === 'object' &&
          typeof child.type === 'string'
        ) {
          collect(child);
        }
      }
    }
  };
  collect(ast);
  return calls;
};

/**
 * @param {string} code
 * @returns {(string | null)[]} the escape of each lookup call in `code`, in source order
 */
const escapesIn = (code) =>
  lookupCallsIn(code).map((call) => classifyEscape(findValueCarrier(call)));

describe('lookupMethodOf', () => {
  it('names a direct .at(), .find(), .findLast(), .pop(), .shift() or .get() call', () => {
    expect(
      lookupCallsIn(
        'arr.at(-1); arr.find(f); arr.findLast(f); arr.pop(); arr.shift(); map.get(k);',
      ).map(lookupMethodOf),
    ).toEqual(['at', 'find', 'findLast', 'pop', 'shift', 'get']);
  });

  it('ignores other methods, computed access and bare calls', () => {
    expect(
      lookupCallsIn(
        "arr.findIndex(f); arr.unshift(x); map.has(k); arr['find'](f); get(k); arr.get;",
      ),
    ).toEqual([]);
  });

  it('ignores a call of a private method that is named like a lookup method', () => {
    expect(
      lookupCallsIn(
        'class Store { #get() {} #find() {} read() { this.#get(); this.#find(); } }',
      ),
    ).toEqual([]);
  });
});

describe('classifyEscape of the value carrier', () => {
  it('reports a result stored in a variable, assignment, object or array', () => {
    expect(escapesIn('const x = arr.find(f);')).toEqual(['stored']);
    expect(escapesIn('x = arr.pop();')).toEqual(['stored']);
    expect(escapesIn('const o = { k: arr.at(0) };')).toEqual(['stored']);
    expect(escapesIn('const l = [arr.at(0)];')).toEqual(['stored']);
  });

  it('reports a result returned from a function body or an expression-bodied arrow', () => {
    expect(escapesIn('function g() { return arr.at(-1); }')).toEqual([
      'returned',
    ]);
    expect(escapesIn('const g = () => arr.at(-1);')).toEqual(['returned']);
  });

  it('reports a result passed as an argument or a JSX expression', () => {
    expect(escapesIn('fn(arr.pop());')).toEqual(['passed']);
    expect(escapesIn('new Thing(arr.find(f));')).toEqual(['passed']);
    expect(escapesIn('<Foo bar={arr.find(f)} />;')).toEqual(['passed']);
  });

  it('passes a result normalised with ?? on its left side, however the right side is written', () => {
    expect(escapesIn('const x = arr.find(f) ?? null;')).toEqual([null]);
    expect(escapesIn("const y = arr.find(f)?.name ?? '';")).toEqual([null]);
    expect(escapesIn('const z = a.find(f) ?? b.at(0) ?? null;')).toEqual([
      null,
      null,
    ]);
  });

  it('reports a result that is the last operand of a ?? chain which is then stored', () => {
    expect(escapesIn('const z = a.find(f) ?? b.at(0);')).toEqual([
      null,
      'stored',
    ]);
  });

  it('passes a result that is branched on, compared or discarded', () => {
    expect(escapesIn('if (arr.find(f)) { g(); }')).toEqual([null]);
    expect(escapesIn('arr.find(f) ? a : b;')).toEqual([null]);
    expect(escapesIn('const t = arr.find(f) !== undefined;')).toEqual([null]);
    expect(escapesIn('const n = !arr.find(f);')).toEqual([null]);
    expect(escapesIn('while (arr.pop()) { g(); }')).toEqual([null]);
    expect(escapesIn('arr.pop();')).toEqual([null]);
  });

  it('follows the value through an optional chain, a conditional branch and a type assertion', () => {
    expect(escapesIn('const e = parts.pop()?.toLowerCase();')).toEqual([
      'stored',
    ]);
    expect(escapesIn('const c = cond ? arr.find(f) : null;')).toEqual([
      'stored',
    ]);
    expect(escapesIn('const a = arr.at(0) as Foo | undefined;')).toEqual([
      'stored',
    ]);
    expect(escapesIn('const s = arr.find(f)?.name;')).toEqual(['stored']);
  });

  it('follows the value through a satisfies expression', () => {
    expect(escapesIn('const s = arr.at(0) satisfies Foo | undefined;')).toEqual(
      ['stored'],
    );
  });

  it('stops at a result that is only a computed key, a callee, the test of a conditional or the right side of || and &&', () => {
    expect(escapesIn('const v = obj[arr.pop()];')).toEqual([null]);
    expect(escapesIn('const o = new (arr.pop())();')).toEqual([null]);
    expect(escapesIn('const t = arr.find(f) ? a : b;')).toEqual([null]);
    expect(escapesIn('const z = a || arr.find(f);')).toEqual([null]);
    expect(escapesIn('const y = a && arr.find(f);')).toEqual([null]);
    expect(escapesIn('const k = { [arr.pop()]: 1 };')).toEqual([null]);
    expect(escapesIn('class Holder { [arr.pop()] = 1; }')).toEqual([null]);
  });

  it('reports a result stored in a class field', () => {
    expect(escapesIn('class Holder { field = arr.pop(); }')).toEqual([
      'stored',
    ]);
  });

  it('returns the node itself, and no escape, for a node without a parent', () => {
    const lonely = { type: 'CallExpression' };

    expect(findValueCarrier(lonely)).toBe(lonely);
    expect(classifyEscape(lonely)).toBeNull();
    expect(classifyEscape({ type: 'CallExpression', parent: null })).toBeNull();
  });

  it('passes a property assigned on a looked-up object, which discards the lookup result itself', () => {
    expect(escapesIn('map.get(k).field = 1;')).toEqual([null]);
    expect(escapesIn('x = map.get(k).field;')).toEqual(['stored']);
  });

  it('passes a result whose method result is only called for its effect', () => {
    expect(escapesIn('arr.find(f)?.dispose();')).toEqual([null]);
  });
});

describe('typeMayBeUndefined', () => {
  /** @param {number} flags */
  const plain = (flags) => ({ flags, isUnion: () => false });
  /** @param {number[]} memberFlags */
  const union = (memberFlags) => ({
    flags: ts.TypeFlags.Union,
    isUnion: () => true,
    types: memberFlags.map((flags) => ({ flags })),
  });

  it('is true for undefined itself and for a union holding it', () => {
    expect(typeMayBeUndefined(plain(ts.TypeFlags.Undefined))).toBe(true);
    expect(
      typeMayBeUndefined(union([ts.TypeFlags.String, ts.TypeFlags.Undefined])),
    ).toBe(true);
  });

  it('is false for a type and a union without undefined, null included', () => {
    expect(typeMayBeUndefined(plain(ts.TypeFlags.String))).toBe(false);
    expect(
      typeMayBeUndefined(union([ts.TypeFlags.String, ts.TypeFlags.Null])),
    ).toBe(false);
  });
});

describe('rule', () => {
  /** @param {string} code @param {unknown[]} [options] */
  const lint = (code, options) =>
    lintInMemory({
      rule,
      files: { '/p/a.ts': code },
      filename: '/p/a.ts',
      options,
    }).map(({ line, column, message }) => [line, column, message]);

  /** @param {string} method @param {string} escape */
  const unnormalized = (method, escape) =>
    `'.${method}()' may return undefined, but its result is ${escape} as is. Normalise it with '?? null' first, or branch on it directly.`;

  it.each([
    ['at', 'items.at(0)'],
    ['find', "items.find((item) => item === 'a')"],
    ['findLast', "items.findLast((item) => item === 'a')"],
    ['pop', 'items.pop()'],
    ['shift', 'items.shift()'],
  ])(
    'reports a stored .%s() of an array, at the method name',
    (method, call) => {
      expect(
        lint(
          `export const run = (items: string[]) => {\n  const found = ${call};\n  return found;\n};\n`,
        ),
      ).toEqual([[2, 23, unnormalized(method, 'stored')]]);
    },
  );

  it('reports a .get() of a Map, and none of a .get() whose type cannot be undefined', () => {
    expect(
      lint(
        "export const run = (map: Map<string, string>) => {\n  const found = map.get('a');\n  return found;\n};\n",
      ),
    ).toEqual([[2, 21, unnormalized('get', 'stored')]]);
    expect(
      lint(
        "type Reader = { get: (key: string) => string };\nexport const run = (reader: Reader) => {\n  const found = reader.get('a');\n  return found;\n};\n",
      ),
    ).toEqual([]);
  });

  it.each([
    ['stored', 'const found = items.pop();\n  return found;'],
    ['returned', 'return items.pop();'],
    ['passed', 'return String(items.pop());'],
  ])(
    'words the report with how the result leaves the expression: %s',
    (escape, body) => {
      expect(
        lint(
          `declare function String(value: unknown): string;\nexport const run = (items: string[]) => {\n  ${body}\n};\n`,
        ).map(([, , message]) => message),
      ).toEqual([unnormalized('pop', escape)]);
    },
  );

  it('reports nothing for a result normalised with ??, branched on, compared or discarded', () => {
    expect(
      lint(
        'export const run = (items: string[]) => {\n  const a = items.pop() ?? null;\n  if (items.shift()) {\n    return a;\n  }\n  items.pop();\n  return items.at(0) !== undefined;\n};\n',
      ),
    ).toEqual([]);
  });

  it('reports every lookup of a file, each at its own method name', () => {
    expect(
      lint(
        'export const run = (items: string[]) => {\n  const first = items.at(0);\n  const last = items.at(-1);\n  return [first, last];\n};\n',
      ).map(([line, column]) => [line, column]),
    ).toEqual([
      [2, 23],
      [3, 22],
    ]);
  });

  it('reports nothing for a call that is no lookup, whatever it returns', () => {
    expect(
      lint(
        'declare function maybe(): string | undefined;\nexport const run = () => {\n  const value = maybe();\n  return value;\n};\n',
      ),
    ).toEqual([]);
  });

  it('accepts no option', () => {
    expect(() => lint('export {};\n', [{}])).toThrow(
      new Error(
        'Key "rules": Key "local/rule-under-test":\n\tValue [{}] should NOT have more than 0 items.\n',
      ),
    );
  });

  it('returns no visitors without a program or a node map from the parser', () => {
    expect(
      rule.create(
        /** @type {any} */ ({ sourceCode: { parserServices: undefined } }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: { program: {} } },
        }),
      ),
    ).toEqual({});
    expect(
      rule.create(
        /** @type {any} */ ({
          sourceCode: { parserServices: { esTreeNodeToTSNodeMap: new Map() } },
        }),
      ),
    ).toEqual({});
  });
});
