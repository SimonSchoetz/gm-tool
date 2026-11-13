import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
  HISTORY_PUSH_TAG,
} from 'lexical';
import type { LexicalEditor } from 'lexical';
import { moveBlock, type DropPlacement } from '../moveBlock';

// Lexical hands an error thrown inside an update to onError, which by default only logs it, so the editors here rethrow it for a test to see.
const throwOnError = (error: Error) => {
  throw error;
};

const makeEditor = (texts: string[]): LexicalEditor => {
  const editor = createEditor({ onError: throwOnError });
  editor.update(
    () => {
      texts.forEach((text) =>
        $getRoot().append($createParagraphNode().append($createTextNode(text))),
      );
    },
    { discrete: true },
  );
  return editor;
};

const textsOf = (editor: LexicalEditor): string[] =>
  editor.read('latest', () =>
    $getRoot()
      .getChildren()
      .map((block) => block.getTextContent()),
  );

const keyOf = (editor: LexicalEditor, text: string): string =>
  editor.read('latest', () => {
    const block = $getRoot()
      .getChildren()
      .find((child) => child.getTextContent() === text);
    if (!block) throw new Error(`no block with text ${text}`);
    return block.getKey();
  });

const move = (
  editor: LexicalEditor,
  dragged: string,
  target: string,
  placement: DropPlacement,
) => {
  const draggedKey = keyOf(editor, dragged);
  const targetKey = keyOf(editor, target);
  editor.update(
    () => {
      moveBlock(draggedKey, targetKey, placement);
    },
    { discrete: true },
  );
};

describe('moveBlock', () => {
  it('puts the dragged block before the target block, the other blocks keeping their order', () => {
    const editor = makeEditor(['a', 'b', 'c', 'd']);

    move(editor, 'd', 'b', 'before');

    expect(textsOf(editor)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('puts the dragged block after the target block, the other blocks keeping their order', () => {
    const editor = makeEditor(['a', 'b', 'c', 'd']);

    move(editor, 'a', 'c', 'after');

    expect(textsOf(editor)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves a block to the first position and to the last position', () => {
    const editor = makeEditor(['a', 'b', 'c']);

    move(editor, 'c', 'a', 'before');
    expect(textsOf(editor)).toEqual(['c', 'a', 'b']);

    move(editor, 'c', 'b', 'after');
    expect(textsOf(editor)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the order alone and commits no update for a position that is the block’s own', () => {
    const editor = makeEditor(['a', 'b', 'c']);
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'b', 'b', 'before');
    move(editor, 'b', 'b', 'after');
    move(editor, 'b', 'a', 'after');
    move(editor, 'b', 'c', 'before');

    expect(textsOf(editor)).toEqual(['a', 'b', 'c']);
    expect(commits).toBe(0);
  });

  it('leaves the order alone when the dragged block or the target block no longer exists', () => {
    const editor = makeEditor(['a', 'b']);
    const existingKey = keyOf(editor, 'a');

    editor.update(
      () => {
        moveBlock('no-such-block', existingKey, 'after');
        moveBlock(existingKey, 'no-such-block', 'after');
      },
      { discrete: true },
    );

    expect(textsOf(editor)).toEqual(['a', 'b']);
  });

  it('tags a move as its own history entry, so one undo reverts the drop and not the typing before it', () => {
    const editor = makeEditor(['a', 'b']);
    const tags: Set<string>[] = [];
    editor.registerUpdateListener(({ tags: updateTags }) => {
      tags.push(updateTags);
    });

    move(editor, 'a', 'b', 'after');

    expect(tags).toHaveLength(1);
    expect(tags[0].has(HISTORY_PUSH_TAG)).toBe(true);
  });

  it('keeps the moved block’s text and its inline formatting', () => {
    const editor = createEditor({ onError: throwOnError });
    editor.update(
      () => {
        $getRoot().append(
          $createParagraphNode().append($createTextNode('plain')),
          $createParagraphNode().append(
            $createTextNode('strong').toggleFormat('bold'),
          ),
        );
      },
      { discrete: true },
    );

    move(editor, 'strong', 'plain', 'before');

    const [moved] = editor.getEditorState().toJSON().root.children;
    expect(moved).toMatchObject({
      children: [{ text: 'strong', format: 1 }],
    });
  });
});
