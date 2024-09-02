module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the use of process.env and encourage the usage of parsedEnv instead.',
      category: 'Best Practices',
      recommended: false,
    },
    messages: {
      avoidProcessEnv: 'Avoid using process.env. Use parsedEnv instead.',
    },
    schema: [], // No options
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'process' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'env'
        ) {
          context.report({
            node,
            message: 'Avoid using process.env. Use parsedEnv instead.',
          });
        }
      },
    };
  },
};
