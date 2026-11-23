// @vitest-environment node

// @ts-check
import { describe, expect, it } from 'vitest';
import rule, { readsAsComment } from '../no-jsx-comment-text.js';
import { lintInMemory } from './support/lintInMemory.js';

describe('readsAsComment', () => {
  it('flags a line comment or block comment opening a line of the text, after any whitespace', () => {
    expect(readsAsComment('// note')).toBe(true);
    expect(readsAsComment('\n  // note\n  ')).toBe(true);
    expect(readsAsComment('\n  /* note */\n')).toBe(true);
    expect(readsAsComment('\n  text\n  // note\n')).toBe(true);
  });

  it('passes a slash that opens no comment or sits mid-line, so prose with slashes and URLs stays allowed', () => {
    expect(readsAsComment('a / b')).toBe(false);
    expect(readsAsComment('and/or')).toBe(false);
    expect(readsAsComment('see http://example.com')).toBe(false);
    expect(readsAsComment('\n  /path\n')).toBe(false);
  });
});

describe('no-jsx-comment-text', () => {
  const filename = '/project/Component.tsx';
  /** @param {string} source */
  const lint = (source) =>
    lintInMemory({ rule, files: { [filename]: source }, filename });

  it('reports a comment written as JSX children text at that text', () => {
    const messages = lint(
      'export const a = <div>\n  // note\n  <span />\n</div>;\n',
    );
    expect(messages).toEqual([
      expect.objectContaining({
        messageId: 'commentAsText',
        message:
          'This comment is JSX children text and renders in the UI; wrap it in braces as `{/* … */}`.',
        line: 1,
        column: 23,
      }),
    ]);
  });

  it('passes a braced comment in children and a comment outside JSX, which are real comments', () => {
    expect(
      lint(
        'export const a = (\n  // note\n  <div>\n    {/* note */}\n  </div>\n);\n',
      ),
    ).toEqual([]);
  });
});
