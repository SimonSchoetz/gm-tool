// @ts-check

const COMMENT_START_AT_LINE_START = /^\s*\/[/*]/m;

/**
 * JSX children text renders verbatim, so a `//` or `/*` comment written between tags shows in the UI instead of being a comment.
 * @param {string} jsxText the raw source of a JSXText node
 * @returns {boolean} true when any line of the text starts, after whitespace, with `//` or `/*`
 */
export const readsAsComment = (jsxText) =>
  COMMENT_START_AT_LINE_START.test(jsxText);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow a `//` or `/*` comment written as JSX children text, where it renders as visible text.',
    },
    schema: [],
    messages: {
      commentAsText:
        'This comment is JSX children text and renders in the UI; wrap it in braces as `{/* … */}`.',
    },
  },
  create(context) {
    return {
      /** @param {import('estree').Node} node */
      JSXText(node) {
        if (readsAsComment(context.sourceCode.getText(node))) {
          context.report({ node, messageId: 'commentAsText' });
        }
      },
    };
  },
};
