import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  createEditor,
  HISTORY_PUSH_TAG,
} from 'lexical';
import type { ElementNode, LexicalEditor, LexicalNode } from 'lexical';
import {
  $createToggleNode,
  $isToggleNode,
  ToggleNode,
} from '../../../../nodes/ToggleNode';
import {
  $createToggleBodyNode,
  ToggleBodyNode,
} from '../../../../nodes/ToggleBodyNode';
import { moveBlock, type DropPlacement } from '../moveBlock';

// Lexical hands an error thrown inside an update to onError, which by default only logs it, so the editors here rethrow it for a test to see.
const throwOnError = (error: Error) => {
  throw error;
};

const makeEditor = (texts: string[]): LexicalEditor => {
  const editor = createEditor({
    nodes: [ToggleNode, ToggleBodyNode],
    onError: throwOnError,
  });
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

// The saved structure as text: a paragraph by its text, a toggle as `header[body, ...]`.
const outlineOfBlock = (block: LexicalNode): string => {
  if (!$isToggleNode(block)) return block.getTextContent() || '(empty)';
  const header = block.getFirstChildOrThrow();
  const body = block.getLastChildOrThrow();
  const bodyOutline = $isElementNode(body)
    ? body.getChildren().map(outlineOfBlock)
    : [];
  return `${header.getTextContent()}[${bodyOutline.join(',')}]`;
};

const outlineOf = (editor: LexicalEditor): string[] =>
  editor.read('latest', () => $getRoot().getChildren().map(outlineOfBlock));

const makeNestedEditor = (): LexicalEditor => {
  const editor = createEditor({
    nodes: [ToggleNode, ToggleBodyNode],
    onError: throwOnError,
  });
  editor.update(
    () => {
      const paragraph = (text: string) =>
        $createParagraphNode().append($createTextNode(text));
      $getRoot().append(
        paragraph('a'),
        $createToggleNode().append(
          paragraph('T'),
          $createToggleBodyNode().append(paragraph('x'), paragraph('y')),
        ),
        paragraph('b'),
        $createToggleNode().append(
          paragraph('U'),
          $createToggleBodyNode().append(paragraph('z')),
        ),
      );
    },
    { discrete: true },
  );
  return editor;
};

// The key of the block with the text, found among the root's blocks and, for a toggle, among its header and then its body's blocks; a toggle is found by its header's text.
const keyOf = (editor: LexicalEditor, text: string): string =>
  editor.read('latest', () => {
    const find = (container: ElementNode): LexicalNode | null => {
      for (const child of container.getChildren()) {
        if ($isToggleNode(child)) {
          if (child.getFirstChildOrThrow().getTextContent() === text) {
            return child;
          }
          const body = child.getLastChildOrThrow();
          const inBody = $isElementNode(body) ? find(body) : null;
          if (inBody !== null) return inBody;
        } else if (child.getTextContent() === text) {
          return child;
        }
      }
      return null;
    };
    const block = find($getRoot());
    if (block === null) throw new Error(`no block with text ${text}`);
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
    const editor = createEditor({
      nodes: [ToggleNode, ToggleBodyNode],
      onError: throwOnError,
    });
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

  it('moves a block into a toggle’s body, between its blocks and out of it', () => {
    const editor = makeNestedEditor();

    move(editor, 'a', 'x', 'before');
    expect(outlineOf(editor)).toEqual(['T[a,x,y]', 'b', 'U[z]']);

    move(editor, 'b', 'x', 'after');
    expect(outlineOf(editor)).toEqual(['T[a,x,b,y]', 'U[z]']);

    move(editor, 'y', 'T', 'after');
    expect(outlineOf(editor)).toEqual(['T[a,x,b]', 'y', 'U[z]']);
  });

  it('moves a toggle into another toggle’s body with its own body', () => {
    const editor = makeNestedEditor();

    move(editor, 'U', 'x', 'after');

    expect(outlineOf(editor)).toEqual(['a', 'T[x,U[z],y]', 'b']);
  });

  it('changes nothing when the target is inside the dragged block', () => {
    const editor = makeNestedEditor();
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'T', 'x', 'before');
    move(editor, 'T', 'y', 'after');

    expect(outlineOf(editor)).toEqual(['a', 'T[x,y]', 'b', 'U[z]']);
    expect(commits).toBe(0);
  });

  it('leaves one empty paragraph in a toggle body that a move empties, and adds nothing to a body that keeps blocks', () => {
    const editor = makeNestedEditor();

    move(editor, 'z', 'a', 'before');
    expect(outlineOf(editor)).toEqual(['z', 'a', 'T[x,y]', 'b', 'U[(empty)]']);

    move(editor, 'x', 'a', 'after');
    expect(outlineOf(editor)).toEqual([
      'z',
      'a',
      'x',
      'T[y]',
      'b',
      'U[(empty)]',
    ]);
  });
});
