// @ts-check
import ts from 'typescript';

/**
 * A node of the ESTree AST ESLint hands a rule, with the `parent` link ESLint adds during traversal.
 * @typedef {{ type: string, parent?: AstNode | null } & Record<string, any>} AstNode
 */

const LOOKUP_METHODS = new Set(['at', 'find', 'pop']);

/**
 * @param {AstNode} node
 * @returns {string | null} the method name when `node` is a direct `.at()`, `.find()` or `.pop()` call, else `null`
 */
export const lookupMethodOf = (node) => {
  if (node.type !== 'CallExpression') {
    return null;
  }
  const callee = node.callee;
  if (
    callee.type !== 'MemberExpression' ||
    callee.computed ||
    callee.property.type !== 'Identifier'
  ) {
    return null;
  }
  return LOOKUP_METHODS.has(callee.property.name) ? callee.property.name : null;
};

/**
 * @param {{ flags: number, isUnion: () => boolean, types?: readonly { flags: number }[] }} type a `ts.Type`
 * @returns {boolean} whether `undefined` is the type itself or one of its union members
 */
export const typeMayBeUndefined = (type) => {
  if (type.isUnion()) {
    return (type.types ?? []).some(
      (member) => (member.flags & ts.TypeFlags.Undefined) !== 0,
    );
  }
  return (type.flags & ts.TypeFlags.Undefined) !== 0;
};

/**
 * Follows the value of `node` outward through the expressions that only forward it — a member access or call on it (`x.pop()?.toLowerCase()`), the optional chain wrapping those, a type assertion, the right operand of `??` and a conditional's branches — because each of them leaves the result possibly `undefined` and hands it to its own parent.
 * @param {AstNode} node
 * @returns {AstNode} the outermost expression that still carries the possibly-undefined value
 */
export const findValueCarrier = (node) => {
  let carrier = node;
  for (;;) {
    const parent = carrier.parent;
    if (!parent) {
      return carrier;
    }
    const forwards =
      (parent.type === 'MemberExpression' && parent.object === carrier) ||
      (parent.type === 'CallExpression' && parent.callee === carrier) ||
      parent.type === 'ChainExpression' ||
      parent.type === 'TSAsExpression' ||
      parent.type === 'TSSatisfiesExpression' ||
      (parent.type === 'LogicalExpression' &&
        parent.operator === '??' &&
        parent.right === carrier) ||
      (parent.type === 'ConditionalExpression' && parent.test !== carrier);
    if (!forwards) {
      return carrier;
    }
    carrier = parent;
  }
};

/**
 * @param {AstNode} carrier the node `findValueCarrier` returned
 * @returns {'stored' | 'returned' | 'passed' | null} how the value leaves the expression, or `null` when it is discarded, compared, branched on, or the left operand of `??`
 */
export const classifyEscape = (carrier) => {
  const parent = carrier.parent;
  if (!parent) {
    return null;
  }
  switch (parent.type) {
    case 'VariableDeclarator':
      return parent.init === carrier ? 'stored' : null;
    case 'AssignmentExpression':
      return parent.right === carrier ? 'stored' : null;
    case 'Property':
    case 'PropertyDefinition':
      return parent.value === carrier ? 'stored' : null;
    case 'ArrayExpression':
      return 'stored';
    case 'ReturnStatement':
      return 'returned';
    case 'ArrowFunctionExpression':
      return parent.body === carrier ? 'returned' : null;
    case 'CallExpression':
    case 'NewExpression':
      return parent.arguments.includes(carrier) ? 'passed' : null;
    case 'JSXExpressionContainer':
      return 'passed';
    default:
      return null;
  }
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow storing, returning or passing a possibly-undefined `.at()`, `.find()` or `.pop()` result without normalising it with `??` first.',
    },
    schema: [],
    messages: {
      unnormalized:
        "'.{{method}}()' may return undefined, but its result is {{escape}} as is. Normalise it with '?? null' first, or branch on it directly.",
    },
  },
  create(context) {
    const services = context.sourceCode.parserServices;
    /** @type {import('typescript').Program | null | undefined} */
    const program = services?.program;
    const esTreeNodeToTSNodeMap = services?.esTreeNodeToTSNodeMap;
    if (!program || !esTreeNodeToTSNodeMap) {
      return {};
    }
    const checker = program.getTypeChecker();

    return {
      CallExpression: (node) => {
        const method = lookupMethodOf(node);
        if (method === null) {
          return;
        }
        const escape = classifyEscape(findValueCarrier(node));
        if (escape === null) {
          return;
        }
        const type = checker.getTypeAtLocation(esTreeNodeToTSNodeMap.get(node));
        if (!typeMayBeUndefined(type)) {
          return;
        }
        context.report({
          node: /** @type {any} */ (node.callee).property,
          messageId: 'unnormalized',
          data: { method, escape },
        });
      },
    };
  },
};
