import { describe, it, expect } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical';
import { $createLinkNode, LinkNode } from '@lexical/link';
import { getSelectionLinkUrl } from '../getSelectionLinkUrl';

describe('getSelectionLinkUrl', () => {
  it('non-range selection returns null', () => {
    const editor = createEditor({ nodes: [LinkNode] });
    const result = editor.getEditorState().read(getSelectionLinkUrl);
    expect(result).toBeNull();
  });

  it('range selection with no link nodes returns null', () => {
    const editor = createEditor({ nodes: [LinkNode] });
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode('hello');
        paragraph.append(textNode);
        $getRoot().append(paragraph);
        textNode.select(0, 5);
      },
      { discrete: true },
    );
    const result = editor.getEditorState().read(getSelectionLinkUrl);
    expect(result).toBeNull();
  });

  it('range selection with a direct LinkNode returns its URL', () => {
    const editor = createEditor({ nodes: [LinkNode] });
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const beforeText = $createTextNode('before');
        const linkNode = $createLinkNode('https://example.com');
        linkNode.append($createTextNode('link'));
        paragraph.append(beforeText);
        paragraph.append(linkNode);
        $getRoot().append(paragraph);
        paragraph.select(0, 2);
      },
      { discrete: true },
    );
    const result = editor.getEditorState().read(getSelectionLinkUrl);
    expect(result).toBe('https://example.com');
  });

  it("range selection where a node's parent is a LinkNode returns the parent URL", () => {
    const editor = createEditor({ nodes: [LinkNode] });
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const linkNode = $createLinkNode('https://parent.com');
        linkNode.append($createTextNode('link text'));
        paragraph.append(linkNode);
        $getRoot().append(paragraph);
        linkNode.select(0, 1);
      },
      { discrete: true },
    );
    const result = editor.getEditorState().read(getSelectionLinkUrl);
    expect(result).toBe('https://parent.com');
  });
});
