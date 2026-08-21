import { $getRoot } from 'lexical';
import type { LexicalEditor } from 'lexical';

// Mirrors DraggableBlockPlugin_EXPERIMENTAL's own private getBlockElement hit-test (never exported, so the technique is replicated rather than imported): each top-level block's hit rectangle uses the block's own top/bottom but anchorElem's full left/right, so a point anywhere across the editor's width — including over the block-drag-handle's gutter — resolves to whichever block's vertical band it falls in.
export const getDragOverTargetElement = (
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  clientX: number,
  clientY: number,
): HTMLElement | null => {
  const anchorElementRect = anchorElem.getBoundingClientRect();

  return editor.read('latest', () => {
    const topLevelKeys = $getRoot().getChildrenKeys();
    for (const key of topLevelKeys) {
      const element = editor.getElementByKey(key);
      if (!element) continue;
      const rect = element.getBoundingClientRect();
      const isWithinBlock =
        clientY >= rect.top &&
        clientY <= rect.bottom &&
        clientX >= anchorElementRect.left &&
        clientX <= anchorElementRect.right;
      if (isWithinBlock) return element;
    }
    return null;
  });
};
