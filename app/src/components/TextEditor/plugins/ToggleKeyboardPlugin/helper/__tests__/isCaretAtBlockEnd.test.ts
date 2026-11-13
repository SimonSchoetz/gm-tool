import { describe, expect, it } from 'vitest';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { isCaretAtBlockEnd } from '../isCaretAtBlockEnd';
import {
  $caretAt,
  inEditor,
  makeEditor,
} from '../../../__tests__/support/toggleFixtures';

describe('isCaretAtBlockEnd', () => {
  it('counts a caret after the last character of plain text as the end, and one before it as not', () => {
    const editor = makeEditor();

    const [atEnd, beforeLast] = inEditor(editor, () => {
      const text = $createTextNode('abc');
      const block = $createParagraphNode().append(text);
      return [
        isCaretAtBlockEnd($caretAt(text, 3), block),
        isCaretAtBlockEnd($caretAt(text, 2), block),
      ];
    });

    expect(atEnd).toBe(true);
    expect(beforeLast).toBe(false);
  });

  it('counts the end of a last run of bold text as the end, and the end of the plain run before it as not', () => {
    const editor = makeEditor();

    const [endOfBold, endOfPlain] = inEditor(editor, () => {
      const plain = $createTextNode('plain ');
      const bold = $createTextNode('bold').toggleFormat('bold');
      const block = $createParagraphNode().append(plain, bold);
      return [
        isCaretAtBlockEnd($caretAt(bold, 4), block),
        isCaretAtBlockEnd($caretAt(plain, 6), block),
      ];
    });

    expect(endOfBold).toBe(true);
    expect(endOfPlain).toBe(false);
  });

  it('counts a caret before a trailing soft line break as not the end, and the one after it on the block as the end', () => {
    const editor = makeEditor();

    const [beforeBreak, afterBreak] = inEditor(editor, () => {
      const text = $createTextNode('abc');
      const block = $createParagraphNode().append(text, $createLineBreakNode());
      return [
        isCaretAtBlockEnd($caretAt(text, 3), block),
        isCaretAtBlockEnd($caretAt(block, 2), block),
      ];
    });

    expect(beforeBreak).toBe(false);
    expect(afterBreak).toBe(true);
  });

  it('counts a caret before the last child of the block as not the end, and one after it as the end', () => {
    const editor = makeEditor();

    const [beforeLast, afterLast] = inEditor(editor, () => {
      const block = $createParagraphNode().append(
        $createTextNode('a'),
        $createLineBreakNode(),
      );
      return [
        isCaretAtBlockEnd($caretAt(block, 1), block),
        isCaretAtBlockEnd($caretAt(block, 2), block),
      ];
    });

    expect(beforeLast).toBe(false);
    expect(afterLast).toBe(true);
  });

  it('counts the end of a link that ends the block as the end, and the same link followed by text as not', () => {
    const editor = makeEditor();

    const [linkLast, linkFollowed] = inEditor(editor, () => {
      const linkedText = $createTextNode('x');
      const link = $createLinkNode('https://example.com').append(linkedText);
      const endsBlock = $createParagraphNode().append(link);
      const linkedTextOfFollowed = $createTextNode('x');
      const followedBlock = $createParagraphNode().append(
        $createLinkNode('https://example.com').append(linkedTextOfFollowed),
        $createTextNode('after'),
      );
      return [
        [
          isCaretAtBlockEnd($caretAt(linkedText, 1), endsBlock),
          isCaretAtBlockEnd($caretAt(link, 1), endsBlock),
        ],
        isCaretAtBlockEnd($caretAt(linkedTextOfFollowed, 1), followedBlock),
      ];
    });

    expect(linkLast).toEqual([true, true]);
    expect(linkFollowed).toBe(false);
  });

  it('counts the caret in an empty block as the end', () => {
    const editor = makeEditor();

    const atEnd = inEditor(editor, () => {
      const block = $createParagraphNode();
      return isCaretAtBlockEnd($caretAt(block, 0), block);
    });

    expect(atEnd).toBe(true);
  });
});
