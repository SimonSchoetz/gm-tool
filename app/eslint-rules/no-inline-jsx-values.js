// @ts-check

/**
 * A node of the ESTree AST ESLint hands a rule, with the `parent` link ESLint adds during traversal.
 * @typedef {{ type: string, parent?: AstNode | null } & Record<string, any>} AstNode
 */

/**
 * The part of an `eslint-scope` variable and scope this rule reads.
 * @typedef {{ identifiers: { range: [number, number] }[], references: { identifier: { range: [number, number] } }[] }} ScopeVariable
 * @typedef {{ variables: ScopeVariable[], childScopes: ScopeNode[] }} ScopeNode
 */

const EXEMPT_ATTRIBUTE_NAMES = new Set(['className', 'style']);
const ITEM_CALLBACK_METHODS = new Set(['map', 'flatMap']);
const FUNCTION_TYPES = new Set([
  'ArrowFunctionExpression',
  'FunctionExpression',
]);
const DERIVED_VALUE_TYPES = new Set([
  'CallExpression',
  'ConditionalExpression',
  'ObjectExpression',
  'ArrayExpression',
]);

/**
 * @param {AstNode} node
 * @returns {AstNode} `node` without the `as`, `satisfies` and `!` wrappers around it
 */
const stripTypeWrappers = (node) => {
  let current = node;
  while (
    current.type === 'TSAsExpression' ||
    current.type === 'TSSatisfiesExpression' ||
    current.type === 'TSNonNullExpression'
  ) {
    current = current.expression;
  }
  return current;
};

/**
 * Strips what only annotates or guards a value (`as`, `satisfies`, `!`, and the `ChainExpression` ESTree wraps around an optional call, `!` inside the chain included), because `onClick={(() => go()) as Handler}` is as much an inline handler as `onClick={() => go()}`. A `ChainExpression` around a member read (`a?.b`) is a bare read and stays whole.
 * @param {AstNode} node
 * @returns {AstNode}
 */
export const unwrapValueExpression = (node) => {
  const stripped = stripTypeWrappers(node);
  if (stripped.type !== 'ChainExpression') {
    return stripped;
  }
  const chained = stripTypeWrappers(stripped.expression);
  return chained.type === 'CallExpression' ? chained : stripped;
};

/**
 * @param {AstNode} value the braced expression of a JSX attribute
 * @returns {'handler' | 'derived' | null} `handler` for an arrow or function expression, `derived` for a call, a `?:`, an object or an array, `null` for every other expression (a bare read, a literal, a template literal, a `||`/`&&`/`??` expression, a JSX element, a `new` expression)
 */
export const classifyJsxValue = (value) => {
  const unwrapped = unwrapValueExpression(value);
  if (FUNCTION_TYPES.has(unwrapped.type)) {
    return 'handler';
  }
  return DERIVED_VALUE_TYPES.has(unwrapped.type) ? 'derived' : null;
};

/**
 * @param {AstNode} attribute a `JSXAttribute`
 * @returns {boolean} whether the attribute is named exactly `className` or `style`, whose values stay in the JSX
 */
export const isExemptAttributeName = (attribute) =>
  attribute.name.type === 'JSXIdentifier' &&
  EXEMPT_ATTRIBUTE_NAMES.has(attribute.name.name);

/**
 * @param {AstNode} node
 * @returns {boolean} whether `node` is a function passed as an argument of a non-computed `.map(...)` or `.flatMap(...)` call
 */
const isItemCallback = (node) => {
  const call = node.parent;
  if (!FUNCTION_TYPES.has(node.type) || call?.type !== 'CallExpression') {
    return false;
  }
  const callee = call.callee;
  return (
    call.arguments.includes(node) &&
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    ITEM_CALLBACK_METHODS.has(callee.property.name)
  );
};

/**
 * @param {AstNode} node
 * @returns {AstNode | null} the outermost `.map(...)`/`.flatMap(...)` callback that contains `node`, or `null` when none does — the outermost one, because a variable declared in an outer callback is read by an attribute in a nested one
 */
export const itemCallbackOf = (node) => {
  /** @type {AstNode | null} */
  let outermost = null;
  for (let current = node.parent; current; current = current.parent) {
    if (isItemCallback(current)) {
      outermost = current;
    }
  }
  return outermost;
};

/**
 * @param {ScopeNode} scope
 * @returns {ScopeVariable[]} the variables of `scope` and of every scope nested in it
 */
export const collectScopeVariables = (scope) => [
  ...scope.variables,
  ...scope.childScopes.flatMap(collectScopeVariables),
];

/**
 * @param {[number, number]} inner
 * @param {[number, number]} outer
 * @returns {boolean}
 */
const isWithin = (inner, outer) => inner[0] >= outer[0] && inner[1] <= outer[1];

/**
 * @param {ScopeVariable[]} variables the variables of the callback and of every scope nested in it
 * @param {[number, number]} callbackRange the source range of the callback
 * @param {[number, number]} expressionRange the source range of the attribute's braced expression
 * @returns {boolean} whether the expression reads a variable declared inside the callback but outside the expression itself — an inline arrow's own parameter is declared inside the expression and never counts
 */
export const readsVariableDeclaredInside = (
  variables,
  callbackRange,
  expressionRange,
) =>
  variables.some(
    (variable) =>
      variable.identifiers.some(
        (identifier) =>
          isWithin(identifier.range, callbackRange) &&
          !isWithin(identifier.range, expressionRange),
      ) &&
      variable.references.some((reference) =>
        isWithin(reference.identifier.range, expressionRange),
      ),
  );

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow an inline function, call, conditional, object or array as a JSX attribute value outside `className` and `style`, except where it reads a `.map()` or `.flatMap()` callback variable.',
    },
    schema: [],
    messages: {
      handler:
        'Declare this inline function as a named const above the return and pass it by name (.claude/rules/src-components.md — Component Internals).',
      derived:
        'Declare this derived value as a named const above the return and pass it by name (.claude/rules/src-components.md — Component Internals).',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      JSXAttribute: (attribute) => {
        const container = /** @type {AstNode | null} */ (attribute.value);
        if (
          container?.type !== 'JSXExpressionContainer' ||
          isExemptAttributeName(attribute)
        ) {
          return;
        }
        const messageId = classifyJsxValue(container.expression);
        if (messageId === null) {
          return;
        }
        const callback = itemCallbackOf(attribute);
        if (
          callback &&
          readsVariableDeclaredInside(
            collectScopeVariables(
              /** @type {ScopeNode} */ (
                /** @type {unknown} */ (sourceCode.getScope(callback))
              ),
            ),
            callback.range,
            container.expression.range,
          )
        ) {
          return;
        }
        context.report({ node: attribute, messageId });
      },
    };
  },
};
