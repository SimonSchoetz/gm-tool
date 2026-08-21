import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import {
  BlockDragHandle,
  BlockDropHighlight,
  BlockDropIndicator,
} from './components';
import {
  getDragOverTargetElement,
  getTargetCalculateHeight,
  isOnMenu,
} from './helper';
import { FCProps } from '@/types';

type Props = {
  anchorElem: HTMLElement;
};

type DragOverRect = {
  top: number;
  height: number;
};

export const BlockDragHandlePlugin: FCProps<Props> = ({ anchorElem }) => {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(
    null,
  );
  const [dragOverRect, setDragOverRect] = useState<DragOverRect | null>(null);
  const barHeight = hoveredElement?.getBoundingClientRect().height ?? null;
  const anchorHeight = hoveredElement
    ? getTargetCalculateHeight(hoveredElement)
    : null;

  // Pushes the drop target away from the node below it to read as the document making room — a direct inline-style write on a Lexical-managed node, safe because Lexical's reconciler skips a node's DOM entirely when it isn't dirty (Lexical.dev.mjs:3414), so this survives as long as nobody edits this exact block mid-drag. Bottom margin only: DraggableBlockPlugin_EXPERIMENTAL's own $onDrop calls insertBefore only when the cursor is above the very first top-level node in the document — getBlockElement's hit-test otherwise only ever returns a block whose own top is at or above the cursor, so pageY >= targetBlockElemTop is true in every other case and insertAfter always wins. currentTarget is a plain closure variable scoped to this effect (not React state), so react-hooks/immutability has nothing to flag when its .style is mutated.
  useEffect(() => {
    let currentTarget: HTMLElement | null = null;

    const applyMargin = (element: HTMLElement) => {
      element.style.marginBottom = 'var(--spacing-xl)';
    };
    const clearMargin = (element: HTMLElement) => {
      element.style.marginBottom = '';
    };

    const handleDragOver = (event: DragEvent) => {
      const target = getDragOverTargetElement(
        editor,
        anchorElem,
        event.clientX,
        event.clientY,
      );
      if (currentTarget !== target) {
        if (currentTarget) clearMargin(currentTarget);
        if (target) applyMargin(target);
        currentTarget = target;
      }
      // Re-measured on every dragover, not gated behind the target reference changing — the target's own position keeps shifting while its neighbors' margin transitions settle, and a new object here (unlike reusing the same element reference in state) always triggers a re-render, so the highlight keeps tracking instead of freezing at a mid-transition snapshot.
      setDragOverRect(
        target
          ? {
              top:
                target.getBoundingClientRect().top -
                anchorElem.getBoundingClientRect().top,
              height: target.getBoundingClientRect().height,
            }
          : null,
      );
    };
    const clearDragOverTarget = () => {
      if (currentTarget) {
        clearMargin(currentTarget);
        currentTarget = null;
      }
      setDragOverRect(null);
    };

    anchorElem.addEventListener('dragover', handleDragOver);
    anchorElem.addEventListener('dragend', clearDragOverTarget);
    anchorElem.addEventListener('drop', clearDragOverTarget);

    return () => {
      anchorElem.removeEventListener('dragover', handleDragOver);
      anchorElem.removeEventListener('dragend', clearDragOverTarget);
      anchorElem.removeEventListener('drop', clearDragOverTarget);
      if (currentTarget) clearMargin(currentTarget);
    };
  }, [editor, anchorElem]);

  return (
    <>
      <DraggableBlockPlugin_EXPERIMENTAL
        anchorElem={anchorElem}
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={
          <BlockDragHandle
            ref={menuRef}
            barHeight={barHeight}
            anchorHeight={anchorHeight}
          />
        }
        targetLineComponent={<BlockDropIndicator ref={targetLineRef} />}
        isOnMenu={isOnMenu}
        onElementChanged={setHoveredElement}
      />
      <BlockDropHighlight
        top={dragOverRect?.top ?? null}
        height={dragOverRect?.height ?? null}
      />
    </>
  );
};
