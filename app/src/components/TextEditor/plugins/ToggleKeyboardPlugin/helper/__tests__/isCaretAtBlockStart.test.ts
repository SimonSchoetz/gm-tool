import { describe, expect, it } from 'vitest';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { isCaretAtBlockStart } from '../isCaretAtBlockStart';
import {
  $caretAt,
  inEditor,
  makeEditor,
} from '../../../__tests__/support/toggleFixtures';

describe('isCaretAtBlockStart', () => {
  it('counts offset zero of the first text as the start, and a caret after its first character as not', () => {
    const editor = makeEditor();

    const [atStart, afterFirst] = inEditor(editor, () => {
      const text = $createTextNode('abc');
      const block = $createParagraphNode().append(text);
      return [
        isCaretAtBlockStart($caretAt(text, 0), block),
        isCaretAtBlockStart($caretAt(text, 1), block),
      ];
    });

    expect(atStart).toBe(true);
    expect(afterFirst).toBe(false);
  });

  it('counts offset zero of a text after a soft line break as not the start', () => {
    const editor = makeEditor();

    const secondLineStart = inEditor(editor, () => {
      const secondLine = $createTextNode('def');
      const block = $createParagraphNode().append(
        $createTextNode('abc'),
        $createLineBreakNode(),
        secondLine,
      );
      return isCaretAtBlockStart($caretAt(secondLine, 0), block);
    });

    expect(secondLineStart).toBe(false);
  });

  it('counts offset zero of a text after an inline node of another kind as not the start', () => {
    const editor = makeEditor();

    const afterInlineNode = inEditor(editor, () => {
      const text = $createTextNode('x');
      const block = $createParagraphNode().append($createLineBreakNode(), text);
      return isCaretAtBlockStart($caretAt(text, 0), block);
    });

    expect(afterInlineNode).toBe(false);
  });

  it('counts a caret on the block before its first child as the start, and one after the first child as not', () => {
    const editor = makeEditor();

    const [beforeFirst, afterFirst] = inEditor(editor, () => {
      const block = $createParagraphNode().append(
        $createLineBreakNode(),
        $createTextNode('a'),
      );
      return [
        isCaretAtBlockStart($caretAt(block, 0), block),
        isCaretAtBlockStart($caretAt(block, 1), block),
      ];
    });

    expect(beforeFirst).toBe(true);
    expect(afterFirst).toBe(false);
  });

  it('counts the start of a link that begins the block as the start, and the same link after text as not', () => {
    const editor = makeEditor();

    const [linkFirst, linkAfterText] = inEditor(editor, () => {
      const linkedText = $createTextNode('x');
      const beginsBlock = $createParagraphNode().append(
        $createLinkNode('https://example.com').append(linkedText),
      );
      const linkedTextAfter = $createTextNode('x');
      const afterBlock = $createParagraphNode().append(
        $createTextNode('before'),
        $createLinkNode('https://example.com').append(linkedTextAfter),
      );
      return [
        isCaretAtBlockStart($caretAt(linkedText, 0), beginsBlock),
        isCaretAtBlockStart($caretAt(linkedTextAfter, 0), afterBlock),
      ];
    });

    expect(linkFirst).toBe(true);
    expect(linkAfterText).toBe(false);
  });

  it('counts the caret in an empty block as the start', () => {
    const editor = makeEditor();

    const atStart = inEditor(editor, () => {
      const block = $createParagraphNode();
      return isCaretAtBlockStart($caretAt(block, 0), block);
    });

    expect(atStart).toBe(true);
  });
});
