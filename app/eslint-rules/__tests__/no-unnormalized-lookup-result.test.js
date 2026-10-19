// @vitest-environment node

// @ts-check
import ts from 'typescript';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import {
  classifyEscape,
  findValueCarrier,
  lookupMethodOf,
  typeMayBeUndefined,
} from '../no-unnormalized-lookup-result.js';

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
