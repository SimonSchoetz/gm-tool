// @ts-check

/**
 * Flags runs of 2+ consecutive same-indentation `//` line comments that read as one
 * sentence/paragraph manually split across physical lines — the pattern root CLAUDE.md's
 * "Never introduce manual line breaks in code comments anywhere in the codebase" rule bans.
 * Heuristic: within a qualifying run, every comment except the last one must end in
 * terminal punctuation (. ! ? or a colon introducing a continuation) for the run to be
 * treated as independently-complete stacked comments rather than a wrapped sentence.
 * A run where any non-last line lacks terminal punctuation is flagged as a candidate wrap.
 */

/** @type {RegExp} matches trailing closing brackets/quotes/backticks before punctuation */
const TRAILING_WRAPPERS = /["')\]`]+$/;

/**
 * @param {string} value raw comment text after the leading `//`
 * @returns {boolean} true if the comment reads as a grammatically complete, terminated line
 */
function endsWithTerminalPunctuation(value) {
  const trimmed = value.trim().replace(TRAILING_WRAPPERS, '');
  return /[.!?:]$/.test(trimmed);
}

/**
 * @param {import('eslint').Rule.RuleContext} context
 * @param {ReturnType<import('eslint').SourceCode['getAllComments']>[number]} comment
 * @returns {number} the comment's starting column (0-indexed)
 */
function columnOf(comment) {
  return comment.loc.start.column;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow a single sentence or paragraph manually split across consecutive `//` comment lines — each comment must be one continuous line per root CLAUDE.md.',
    },
    schema: [],
    messages: {
      wrappedComment:
        'This comment appears to be a single sentence manually wrapped across {{count}} lines. Root CLAUDE.md requires each comment to be one continuous line — join these into a single `//` line, or confirm each line is an independently complete statement.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      'Program:exit'() {
        const lineComments = sourceCode
          .getAllComments()
          .filter((comment) => comment.type === 'Line');

        let index = 0;
        while (index < lineComments.length) {
          const group = [lineComments[index]];
          let next = index + 1;

          while (next < lineComments.length) {
            const prev = group[group.length - 1];
            const candidate = lineComments[next];
            const sameColumn = columnOf(candidate) === columnOf(prev);
            const adjacentLine =
              candidate.loc.start.line === prev.loc.end.line + 1;
            const noTokenBetween =
              sourceCode.getTokenBefore(candidate, {
                includeComments: true,
              }) === prev;

            if (!sameColumn || !adjacentLine || !noTokenBetween) {
              break;
            }

            group.push(candidate);
            next += 1;
          }

          if (group.length >= 2) {
            const nonLastLinesAllTerminated = group
              .slice(0, -1)
              .every((comment) => endsWithTerminalPunctuation(comment.value));

            if (!nonLastLinesAllTerminated) {
              context.report({
                loc: {
                  start: group[0].loc.start,
                  end: group[group.length - 1].loc.end,
                },
                messageId: 'wrappedComment',
                data: { count: String(group.length) },
              });
            }
          }

          index = next;
        }
      },
    };
  },
};
