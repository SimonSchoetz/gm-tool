import { describe, it, expect, afterEach } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical';
import type { LexicalEditor } from 'lexical';
import { getDragOverTargetElement } from '../getDragOverTargetElement';

const stubRect = (
  element: HTMLElement,
  rect: { top: number; bottom: number; left: number; right: number },
) => {
  element.getBoundingClientRect = () => rect as DOMRect;
};

const makeEditorWithBlocks = (
  blockHeights: number[],
): {
  editor: LexicalEditor;
  rootElement: HTMLElement;
  blocks: HTMLElement[];
} => {
  const editor = createEditor();
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  editor.setRootElement(rootElement);

  editor.update(
    () => {
      const root = $getRoot();
      for (let i = 0; i < blockHeights.length; i++) {
        root.append(
          $createParagraphNode().append($createTextNode(`block ${i}`)),
        );
      }
    },
    { discrete: true },
  );

  const blocks = editor.read('latest', () =>
    $getRoot()
      .getChildrenKeys()
      .map((key) => {
        const element = editor.getElementByKey(key);
        if (!element) throw new Error('block element missing from DOM');
        return element;
      }),
  );

  let top = 0;
  blocks.forEach((element, index) => {
    const height = blockHeights[index];
    stubRect(element, { top, bottom: top + height, left: 20, right: 40 });
    top += height;
  });
  stubRect(rootElement, { top: 0, bottom: top, left: 0, right: 100 });

  return { editor, rootElement, blocks };
};

describe('getDragOverTargetElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the block whose vertical band contains the point', () => {
    const { editor, rootElement, blocks } = makeEditorWithBlocks([20, 20, 20]);

    const result = getDragOverTargetElement(editor, rootElement, 50, 25);

    expect(result).toBe(blocks[1]);
  });

  it("returns the block even when the point is outside the block's own horizontal bounds but within anchorElem's — this is the gutter-hover behavior the technique exists for", () => {
    const { editor, rootElement, blocks } = makeEditorWithBlocks([20, 20, 20]);

    // blocks are stubbed with left: 20, right: 40, but the point sits at x=5 — inside anchorElem's 0-100 range, outside the block's own 20-40 range.
    const result = getDragOverTargetElement(editor, rootElement, 5, 25);

    expect(result).toBe(blocks[1]);
  });

  it("returns null when the point is outside every block's vertical band", () => {
    const { editor, rootElement } = makeEditorWithBlocks([20, 20, 20]);

    const result = getDragOverTargetElement(editor, rootElement, 50, 100);

    expect(result).toBe(null);
  });

  it("returns null when the point is outside anchorElem's horizontal bounds", () => {
    const { editor, rootElement } = makeEditorWithBlocks([20, 20, 20]);

    const result = getDragOverTargetElement(editor, rootElement, 200, 25);

    expect(result).toBe(null);
  });

  it.each([
    ['top edge of the first block', 50, 0, 0],
    ['bottom edge of the first block, which the next block shares', 50, 20, 0],
    ['bottom edge of the last block', 50, 60, 2],
    ['left edge of the anchor element', 0, 25, 1],
    ['right edge of the anchor element', 100, 25, 1],
  ])('counts a point on the %s as inside', (_edge, x, y, blockIndex) => {
    const { editor, rootElement, blocks } = makeEditorWithBlocks([20, 20, 20]);

    const result = getDragOverTargetElement(editor, rootElement, x, y);

    expect(result).toBe(blocks[blockIndex]);
  });

  it.each([
    ['above every block', 50, -1],
    ['left of the anchor element', -1, 25],
    ['right of the anchor element', 101, 25],
    ['below every block', 50, 61],
  ])('returns null for a point %s', (_where, x, y) => {
    const { editor, rootElement } = makeEditorWithBlocks([20, 20, 20]);

    expect(getDragOverTargetElement(editor, rootElement, x, y)).toBe(null);
  });

  it('skips a block that has no element and finds the block below it', () => {
    const { editor, rootElement, blocks } = makeEditorWithBlocks([20, 20, 20]);
    const [firstKey] = editor.read('latest', () =>
      $getRoot().getChildrenKeys(),
    );
    const getElementByKey = editor.getElementByKey.bind(editor);
    editor.getElementByKey = (key) =>
      key === firstKey ? null : getElementByKey(key);

    const result = getDragOverTargetElement(editor, rootElement, 50, 25);

    expect(result).toBe(blocks[1]);
  });

  it('hit-tests the blocks that are committed, not a change that is still pending', () => {
    const { editor, rootElement, blocks } = makeEditorWithBlocks([20]);
    stubRect(blocks[0], { top: 10, bottom: 30, left: 20, right: 40 });
    editor.update(() => {
      $getRoot().append($createParagraphNode().append($createTextNode('new')));
    });

    // The pending block would get an empty rectangle at the origin once committed, and the committed block starts at y = 10.
    const result = getDragOverTargetElement(editor, rootElement, 50, 0);

    expect(result).toBe(null);
  });
});
