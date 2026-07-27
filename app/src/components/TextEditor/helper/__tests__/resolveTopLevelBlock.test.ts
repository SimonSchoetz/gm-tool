import { describe, it, expect } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  createEditor,
} from 'lexical';
import { resolveTopLevelBlock } from '../resolveTopLevelBlock';

const makeEditor = () => createEditor();

describe('resolveTopLevelBlock', () => {
  it('returns the root node itself when passed the root node', () => {
    const editor = makeEditor();

    const result = editor
      .getEditorState()
      .read(() => resolveTopLevelBlock($getRoot()));

    expect(result.getKey()).toBe('root');
  });

  it('returns the top-level element for a node nested inside a paragraph', () => {
    const editor = makeEditor();
    let paragraphKey = '';
    let textKey = '';
    editor.update(
      () => {
        const textNode = $createTextNode('hello');
        const paragraph = $createParagraphNode().append(textNode);
        $getRoot().append(paragraph);
        paragraphKey = paragraph.getKey();
        textKey = textNode.getKey();
      },
      { discrete: true },
    );

    const result = editor.getEditorState().read(() => {
      const textNode = $getNodeByKey(textKey);
      if (!textNode) throw new Error('text node missing from editor state');
      return resolveTopLevelBlock(textNode);
    });

    expect(result.getKey()).toBe(paragraphKey);
    expect(result.getKey()).not.toBe(textKey);
  });
});
