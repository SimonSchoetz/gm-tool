/* global module */
export default {
  create(context) {
    return {
      TSEnumDeclaration(node) {
        const enumMembers = node.members.map((member) => member.id.name);

        const sortedMembers = [...enumMembers].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );

        if (JSON.stringify(enumMembers) !== JSON.stringify(sortedMembers)) {
          context.report({
            fix(fixer) {
              const sourceCode = context.getSourceCode();
              const sortedText = sortedMembers
                .map((name) =>
                  sourceCode
                    .getText(node.members.find((m) => m.id.name === name))
                    .trim()
                )
                .join(',\n');
              return fixer.replaceTextRange(
                [
                  node.members[0].range[0],
                  node.members[node.members.length - 1].range[1],
                ],
                sortedText
              );
            },
            message: 'Enum members should be sorted alphabetically',
            node,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      category: 'Stylistic Issues',
      description: 'Require enums to be sorted alphabetically',
      recommended: false,
    },
    fixable: 'code', // Can automatically fix the order
    schema: [], // No options
    type: 'suggestion',
  },
};
