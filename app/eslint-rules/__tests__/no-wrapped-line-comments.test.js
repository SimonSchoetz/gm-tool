// @vitest-environment node

// @ts-check
import { RuleTester } from 'eslint';
import rule from '../no-wrapped-line-comments.js';

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2022 } });

ruleTester.run('no-wrapped-line-comments', rule, {
  valid: [
    // One comment is no run.
    '// One complete line.\nconst a = 1;',
    // Each line of a run ends a statement of its own.
    '// First statement.\n// Second statement.\nconst a = 1;',
    '// Question?\n// Answer!\n// Introduction:\n// and a continuation\nconst a = 1;',
    // Closing brackets and quotes before the punctuation count.
    '// He said "stop."\n// (Then he left.)\n// See `the code.`\n// The end\nconst a = 1;',
    // Two closing characters before the punctuation count, and so does space after it.
    '// (He said "stop.")\n// Last line\nconst a = 1; // x\n',
    '// Terminated.   \n// Last line\nconst a = 1;',
    // A blank line, a token or another column ends a run.
    '// a wrapped\n\n// sentence\nconst a = 1;',
    'const a = 1; // a wrapped\n// sentence\nconst b = 2;',
    'function f() {\n  // a wrapped\n// sentence\n  return 1;\n}',
    // Block comments are not line comments.
    '/* a wrapped\n   sentence */\n/* another wrapped\n   sentence */\nconst a = 1;',
  ],
  invalid: [
    {
      code: '// A wrapped "sentence"\n// ends here.\nconst a = 1;',
      errors: [{ messageId: 'wrappedComment' }],
    },
    {
      code: '// About 1.5 times as long\n// as before.\nconst a = 1;',
      errors: [{ messageId: 'wrappedComment' }],
    },
    {
      code: '// First line of a sentence\n// second line.\nconst a = 1;',
      errors: [
        {
          message:
            'This comment appears to be a single sentence manually wrapped across 2 lines. Root CLAUDE.md requires each comment to be one continuous line — join these into a single `//` line, or confirm each line is an independently complete statement.',
        },
      ],
    },
    {
      code: '// This sentence continues\n// onto the next line.\nconst a = 1;',
      errors: [
        {
          messageId: 'wrappedComment',
          data: { count: '2' },
          line: 1,
          column: 1,
          endLine: 2,
          endColumn: 23,
        },
      ],
    },
    {
      code: 'function f() {\n  // One statement.\n  // a wrapped\n  // sentence\n  return 1;\n}',
      errors: [
        {
          messageId: 'wrappedComment',
          data: { count: '3' },
          line: 2,
          endLine: 4,
        },
      ],
    },
    {
      code: '// A wrapped sentence, with a comma,\n// and a second line;\n// and a third line.\nconst a = 1;',
      errors: [{ messageId: 'wrappedComment', data: { count: '3' } }],
    },
    {
      code: '// First wrapped\n// sentence.\nconst a = 1;\n\n// Second wrapped\n// sentence.\nconst b = 2;',
      errors: [
        { messageId: 'wrappedComment', line: 1, endLine: 2 },
        { messageId: 'wrappedComment', line: 5, endLine: 6 },
      ],
    },
  ],
});
