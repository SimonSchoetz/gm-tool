import { describe, it, expect } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical';
import {
  $createListItemNode,
  $createListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { collectContentNodes } from '../collectContentNodes';

const makeEditor = () => createEditor({ nodes: [ListNode, ListItemNode] });

describe('collectContentNodes', () => {
  it('returns the node wrapped in an array when it is not a list or list item node', () => {
    const editor = makeEditor();
    let paragraphKey = '';

    editor.update(
      () => {
        const paragraph = $createParagraphNode().append(
          $createTextNode('hello'),
        );
        $getRoot().append(paragraph);
        paragraphKey = paragraph.getKey();
      },
      { discrete: true },
    );

    const result = editor.getEditorState().read(() => {
      const paragraph = $getRoot().getFirstChildOrThrow();
      return collectContentNodes(paragraph);
    });

    expect(result).toHaveLength(1);
    expect(result[0].getKey()).toBe(paragraphKey);
  });

  it('flattens a list node into the content nodes of its list items', () => {
    const editor = makeEditor();

    editor.update(
      () => {
        const list = $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('a')),
          $createListItemNode().append($createTextNode('b')),
        );
        $getRoot().append(list);
      },
      { discrete: true },
    );

    const result = editor.getEditorState().read(() => {
      const list = $getRoot().getFirstChildOrThrow();
      return collectContentNodes(list).map((node) => node.getTextContent());
    });

    expect(result).toEqual(['a', 'b']);
  });

  it('recursively flattens a list item containing a nested list', () => {
    const editor = makeEditor();

    editor.update(
      () => {
        const nestedList = $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('nested')),
        );
        const outerListItem = $createListItemNode().append(nestedList);
        $getRoot().append(outerListItem);
      },
      { discrete: true },
    );

    const result = editor.getEditorState().read(() => {
      const outerListItem = $getRoot().getFirstChildOrThrow();
      return collectContentNodes(outerListItem).map((node) =>
        node.getTextContent(),
      );
    });

    expect(result).toEqual(['nested']);
  });
});
