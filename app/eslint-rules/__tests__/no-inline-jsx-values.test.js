// @vitest-environment node

// @ts-check
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import rule, {
  classifyJsxValue,
  collectScopeVariables,
  isExemptAttributeName,
  itemCallbackOf,
  readsVariableDeclaredInside,
  unwrapValueExpression,
} from '../no-inline-jsx-values.js';

/**
 * @typedef {import('../no-inline-jsx-values.js').AstNode} AstNode
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
 * @returns {{ ast: AstNode, scopeManager: any }}
 */
const parse = (code) => {
  const { ast, scopeManager } = /** @type {any} */ (
    tseslint.parser
  ).parseForESLint(code, {
    filePath: 'probe.tsx',
    ecmaFeatures: { jsx: true },
  });
  attachParents(ast, null);
  return { ast, scopeManager };
};

/**
 * @param {AstNode} node
 * @param {(node: AstNode) => boolean} matches
 * @returns {AstNode[]} every node under `node` for which `matches` is true, in source order
 */
const findAll = (node, matches) => {
  /** @type {AstNode[]} */
  const found = matches(node) ? [node] : [];
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
        found.push(...findAll(child, matches));
      }
    }
  }
  return found;
};

/**
 * @param {string} code a JSX element with one attribute `a`
 * @returns {AstNode} the `JSXAttribute` named `a`
 */
const attributeIn = (code) => {
  const { ast } = parse(`const x = ${code};`);
  const [attribute] = findAll(
    ast,
    (node) => node.type === 'JSXAttribute' && node.name.name === 'a',
  );
  return /** @type {AstNode} */ (attribute);
};

/**
 * @param {string} expression
 * @returns {AstNode} the braced expression of the attribute `a` in `<A a={expression} />`
 */
const valueOf = (expression) =>
  attributeIn(`<A a={${expression}} />`).value.expression;

describe('unwrapValueExpression', () => {
  it('strips as, satisfies, non-null and an optional call, in any nesting order', () => {
    expect(
      unwrapValueExpression(valueOf('((() => go()) as Handler)!')).type,
    ).toBe('ArrowFunctionExpression');
    expect(
      unwrapValueExpression(valueOf('(() => go()) satisfies Handler')).type,
    ).toBe('ArrowFunctionExpression');
    expect(unwrapValueExpression(valueOf('make?.()!')).type).toBe(
      'CallExpression',
    );
    expect(unwrapValueExpression(valueOf('(a?.b?.()) as Foo')).type).toBe(
      'CallExpression',
    );
  });

  it('leaves an optional member read whole', () => {
    expect(unwrapValueExpression(valueOf('a?.b')).type).toBe('ChainExpression');
  });
});

describe('classifyJsxValue', () => {
  it.each([
    ['an arrow function', '() => go()', 'handler'],
    ['a function expression', 'function () { go(); }', 'handler'],
    ['an arrow behind as', '(() => go()) as Handler', 'handler'],
    ['a call', 'make(1)', 'derived'],
    ['an array method call', 'xs.map(f)', 'derived'],
    ['an optional call', 'make?.(1)', 'derived'],
    ['a conditional', 'on ? 1 : 2', 'derived'],
    ['an object', '{ a: 1 }', 'derived'],
    ['an array', '[1, 2]', 'derived'],
  ])('reports %s', (_name, expression, kind) => {
    expect(classifyJsxValue(valueOf(expression))).toBe(kind);
  });

  it.each([
    ['an identifier', 'value'],
    ['a member read', 'props.value'],
    ['an optional member read', 'props?.value'],
    ['a number literal', '3'],
    ['a string literal', "'a'"],
    ['a template literal', '`a${b}`'],
    ['an || expression', 'a || f()'],
    ['an && expression', 'a && f()'],
    ['a ?? expression', 'a ?? f()'],
    ['a unary expression', '!a'],
    ['a binary expression', 'a + 1'],
    ['a JSX element', '<B />'],
    ['a new expression', 'new Date()'],
  ])('does not report %s', (_name, expression) => {
    expect(classifyJsxValue(valueOf(expression))).toBeNull();
  });
});

describe('isExemptAttributeName', () => {
  it('is true for className and style only', () => {
    expect(isExemptAttributeName(attributeIn('<A a={1} />'))).toBe(false);
    const { ast } = parse(
      'const x = <A className={a} style={b} buttonStyle={c} xlink:href={d} />;',
    );
    const names = findAll(ast, (node) => node.type === 'JSXAttribute').map(
      (attribute) => isExemptAttributeName(attribute),
    );
    expect(names).toEqual([true, true, false, false]);
  });
});

describe('itemCallbackOf', () => {
  /**
   * @param {string} code
   * @returns {AstNode | null} what `itemCallbackOf` returns for the attribute `a`
   */
  const callbackFor = (code) => itemCallbackOf(attributeIn(code));

  it('returns the callback of a map or flatMap call that contains the attribute', () => {
    expect(callbackFor('xs.map((x) => <A a={() => f(x)} />)')?.type).toBe(
      'ArrowFunctionExpression',
    );
    expect(
      callbackFor('xs.flatMap(function (x) { return <A a={() => f(x)} />; })')
        ?.type,
    ).toBe('FunctionExpression');
  });

  it('returns the outermost callback when map calls are nested', () => {
    const { ast } = parse(
      'const x = xs.map((outer) => ys.map((inner) => <A a={1} />));',
    );
    const [outerCall] = findAll(ast, (node) => node.type === 'CallExpression');
    const [attribute] = findAll(ast, (node) => node.type === 'JSXAttribute');
    expect(itemCallbackOf(attribute)).toBe(outerCall.arguments[0]);
  });

  it.each([
    ['a forEach callback', 'xs.forEach((x) => <A a={1} />)'],
    ['a computed map call', "xs['map']((x) => <A a={1} />)"],
    ['a filter callback', 'xs.filter((x) => <A a={1} />)'],
    ['a bare function', '(() => <A a={1} />)'],
    ['a function that is the callee of a call', '(() => <A a={1} />)()'],
    ['no function', '<A a={1} />'],
  ])('returns null inside %s', (_name, code) => {
    expect(callbackFor(code)).toBeNull();
  });

  it('returns null for a function that is not an argument of map', () => {
    expect(callbackFor('map(() => 1, (x) => <A a={1} />)')).toBeNull();
  });
});

describe('collectScopeVariables', () => {
  it('collects the variables of a scope and of every nested scope', () => {
    const { ast, scopeManager } = parse(
      'const f = (item) => { const label = g(item); if (item) { const inner = 1; } return label; };',
    );
    const [fn] = findAll(
      ast,
      (node) => node.type === 'ArrowFunctionExpression',
    );
    const names = collectScopeVariables(scopeManager.acquire(fn))
      .flatMap((variable) => variable.identifiers)
      .map((identifier) => /** @type {any} */ (identifier).name)
      .sort();
    expect(names).toEqual(['inner', 'item', 'label']);
  });
});

describe('readsVariableDeclaredInside', () => {
  /**
   * @param {string} code a `.map` call holding one attribute `a`
   * @returns {boolean} the verdict for the attribute against its callback's variables
   */
  const verdictFor = (code) => {
    const { ast, scopeManager } = parse(`const x = ${code};`);
    const [attribute] = findAll(
      ast,
      (node) => node.type === 'JSXAttribute' && node.name.name === 'a',
    );
    const callback = /** @type {AstNode} */ (itemCallbackOf(attribute));
    return readsVariableDeclaredInside(
      collectScopeVariables(scopeManager.acquire(callback)),
      callback.range,
      attribute.value.expression.range,
    );
  };

  it('is true for a read of the callback parameter', () => {
    expect(verdictFor('xs.map((item) => <A a={() => f(item.id)} />)')).toBe(
      true,
    );
  });

  it('is true for a read of a local declared in the callback body', () => {
    expect(
      verdictFor(
        'xs.map((item) => { const label = g(item); return <A a={() => f(label)} />; })',
      ),
    ).toBe(true);
  });

  it('is true for a read of a variable of an enclosing callback from a nested one', () => {
    expect(
      verdictFor(
        'xs.map((outer) => ys.map((inner) => <A a={() => f(outer)} />))',
      ),
    ).toBe(true);
  });

  it('is false when the expression reads only variables declared outside the callback', () => {
    expect(verdictFor('xs.map((item) => <A a={() => f(outside)} />)')).toBe(
      false,
    );
  });

  it('is false when the only variable read is the expression’s own parameter', () => {
    expect(verdictFor('xs.map((item) => <A a={(event) => f(event)} />)')).toBe(
      false,
    );
  });
});

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

/**
 * @param {string[]} codes
 * @returns {{ code: string, filename: string }[]}
 */
const asTsx = (codes) => codes.map((code) => ({ code, filename: 'probe.tsx' }));

/**
 * @param {[string, 'handler' | 'derived'][]} cases
 * @returns {{ code: string, filename: string, errors: { messageId: 'handler' | 'derived' }[] }[]}
 */
const asInvalid = (cases) =>
  cases.map(([code, messageId]) => ({
    code,
    filename: 'probe.tsx',
    errors: [{ messageId }],
  }));

ruleTester.run('no-inline-jsx-values', rule, {
  valid: asTsx([
    'const x = <A className={cn("a", on && "b")} />;',
    'const x = <A style={{ width: size }} />;',
    'const x = <A style={getStyle(size)} />;',
    'const x = <A onClick={onClick} value={props.value} id="a" disabled />;',
    'const x = <A label={`a${b}`} count={3} on={a && b} fallback={a ?? b} />;',
    'const x = <A icon={<B />} created={new Date()} negated={!a} sum={a + 1} />;',
    'const x = <A {...props} {...getProps()} />;',
    'const x = <A onClick={onClick} />;',
    'const x = xs.map((item) => <A onClick={() => onSelect(item.id)} />);',
    'const x = xs.map((item) => <A key={getKey(item)} items={item.rows.map(f)} />);',
    'const x = xs.flatMap((item) => [<A onClick={() => onSelect(item)} />]);',
    'const x = xs.map(function (item) { return <A onClick={() => onSelect(item)} />; });',
    'const x = xs.map((item) => { const label = format(item); return <A onClick={() => onSelect(label)} />; });',
    'const x = xs.map((outer) => ys.map((inner) => <A onClick={() => onSelect(outer.id)} />));',
    'const x = xs.map(({ id, name }) => <A value={name ? { id } : null} />);',
  ]),
  invalid: asInvalid([
    ['const x = <A onClick={() => go()} />;', 'handler'],
    ['const x = <A onClick={async () => { await go(); }} />;', 'handler'],
    ['const x = <A ref={function (el) { keep(el); }} />;', 'handler'],
    ['const x = <A onClick={(() => go()) as Handler} />;', 'handler'],
    ['const x = <A onClick={(() => go()) satisfies Handler} />;', 'handler'],
    ['const x = <A items={xs.map(f)} />;', 'derived'],
    ['const x = <A value={make(1)} />;', 'derived'],
    ['const x = <A value={make?.(1)} />;', 'derived'],
    ['const x = <A variant={on ? "a" : "b"} />;', 'derived'],
    ['const x = <A options={{ a: 1 }} />;', 'derived'],
    ['const x = <A options={[1, 2]} />;', 'derived'],
    ['const x = <A buttonStyle={pick(a)} />;', 'derived'],
    ['const x = <A classNames={cn("a")} />;', 'derived'],
    ['const x = xs.map((item) => <A onClick={() => go()} />);', 'handler'],
    [
      'const x = xs.map((item) => <A onClick={(event) => go(event)} />);',
      'handler',
    ],
    [
      'const x = xs.forEach((item) => <A onClick={() => f(item)} />);',
      'handler',
    ],
    [
      'const x = xs.filter((item) => <A onClick={() => f(item)} />);',
      'handler',
    ],
    [
      'const x = xs.map((item) => <A onClick={() => f(outside)} />);',
      'handler',
    ],
  ]),
});
