import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  type NodeKey,
} from 'lexical';
import { BlockDragHandle } from './components/BlockDragHandle/BlockDragHandle';
import { BlockDropHighlight } from './components/BlockDropHighlight/BlockDropHighlight';
import { BlockDropIndicator } from './components/BlockDropIndicator/BlockDropIndicator';
import { collectBlockRows, type BlockRow } from './helper/collectBlockRows';
import { moveBlock } from './helper/moveBlock';
import { resolveDropTarget, type DropTarget } from './helper/resolveDropTarget';
import { resolveHoveredRow } from './helper/resolveHoveredRow';
import { FCProps } from '@/types/fcProps.type';

// The only data type this drag puts on the clipboard, so no other editor or input accepts the drop.
const DRAG_BLOCK_FORMAT = 'application/x-gm-block-drag';

type Props = {
  anchorElem: HTMLElement;
};

// Positions are relative to the anchor element, which is the editor container the handle, the drop indicator and the highlight are absolutely positioned in.
type HoveredBlock = {
  key: NodeKey;
  top: number;
  height: number;
};

type DropIndicatorPosition = {
  lineTop: number;
  highlightTop: number;
  highlightHeight: number;
};

export const BlockDragHandlePlugin: FCProps<Props> = ({ anchorElem }) => {
  const [editor] = useLexicalComposerContext();
  const handleRef = useRef<HTMLDivElement>(null);
  const [hoveredBlock, setHoveredBlock] = useState<HoveredBlock | null>(null);
  const [dropIndicator, setDropIndicator] =
    useState<DropIndicatorPosition | null>(null);

  // Read as a dependency of the effect below, which would otherwise re-register every listener on each render.
  const toAnchorSpace = useCallback(
    (clientY: number) => clientY - anchorElem.getBoundingClientRect().top,
    [anchorElem],
  );

  // The effect owns every piece of drag state that is not rendered — the hovered row, the dragged block's key and the margin it pushed — as closure variables, so the handlers share them without a render in between.
  useEffect(() => {
    let hoveredRow: BlockRow | null = null;
    let draggedKey: NodeKey | null = null;
    // Pushes the row above the drop gap away from the row below it so the gap reads as the document making room — a direct inline-style write on a Lexical-managed node, safe because Lexical's reconciler skips a node's DOM entirely when it isn't dirty (Lexical.dev.mjs:3414), so it survives unless the block itself is edited mid-drag. The transition lives in TextEditor.css.
    let pushedMargin: {
      element: HTMLElement;
      margin: 'marginTop' | 'marginBottom';
    } | null = null;

    const clearPushedMargin = () => {
      if (pushedMargin === null) return;
      pushedMargin.element.style[pushedMargin.margin] = '';
      pushedMargin = null;
    };

    const pushMargin = (target: DropTarget) => {
      const { row, margin } = target.gap;
      if (
        pushedMargin?.element === row.element &&
        pushedMargin.margin === margin
      ) {
        return;
      }
      clearPushedMargin();
      row.element.style[margin] = 'var(--spacing-xl)';
      pushedMargin = { element: row.element, margin };
    };

    const clearDrag = () => {
      draggedKey = null;
      clearPushedMargin();
      setDropIndicator(null);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (draggedKey !== null) return;
      const row = resolveHoveredRow(collectBlockRows(editor), event.clientY);
      if (row?.key === hoveredRow?.key) return;
      hoveredRow = row;
      setHoveredBlock(
        row === null
          ? null
          : {
              key: row.key,
              top: toAnchorSpace(row.top),
              height: row.bottom - row.top,
            },
      );
    };

    const handleMouseLeave = () => {
      if (draggedKey !== null) return;
      hoveredRow = null;
      setHoveredBlock(null);
    };

    const handleDragStart = (event: DragEvent) => {
      const { dataTransfer } = event;
      const isOnHandle =
        event.target instanceof Node &&
        handleRef.current?.contains(event.target);
      if (hoveredRow === null || dataTransfer === null || !isOnHandle) return;
      const { element, key } = hoveredRow;
      dataTransfer.setData(DRAG_BLOCK_FORMAT, key);
      dataTransfer.effectAllowed = 'move';
      // Removes the borders the browser would otherwise paint around the drag image, as the Lexical drag plugin this replaced did.
      const previousTransform = element.style.transform;
      element.style.transform = 'translateZ(0)';
      dataTransfer.setDragImage(element, 0, 0);
      setTimeout(() => {
        element.style.transform = previousTransform;
      });
      draggedKey = key;
    };

    const handleDragEnd = () => {
      clearDrag();
      editor.focus();
    };

    const handleDragOver = (event: DragEvent): boolean => {
      if (draggedKey === null) return false;
      const target = resolveDropTarget(collectBlockRows(editor), event.clientY);
      if (target === null) return false;
      // Lets the browser fire the drop event here.
      event.preventDefault();
      pushMargin(target);
      // A new object on every dragover, so the highlight keeps tracking the row while the margin transition moves it.
      setDropIndicator({
        lineTop: toAnchorSpace(target.lineTop),
        highlightTop: toAnchorSpace(target.row.top),
        highlightHeight: target.row.bottom - target.row.top,
      });
      return true;
    };

    const handleDrop = (event: DragEvent): boolean => {
      const droppedKey = draggedKey;
      if (droppedKey === null) return false;
      event.preventDefault();
      const target = resolveDropTarget(collectBlockRows(editor), event.clientY);
      clearDrag();
      if (target !== null)
        moveBlock(droppedKey, target.row.key, target.placement);
      hoveredRow = null;
      setHoveredBlock(null);
      return true;
    };

    anchorElem.addEventListener('mousemove', handleMouseMove);
    anchorElem.addEventListener('mouseleave', handleMouseLeave);
    anchorElem.addEventListener('dragstart', handleDragStart);
    anchorElem.addEventListener('dragend', handleDragEnd);
    const unregisterDragOver = editor.registerCommand(
      DRAGOVER_COMMAND,
      handleDragOver,
      COMMAND_PRIORITY_LOW,
    );
    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      handleDrop,
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      anchorElem.removeEventListener('mousemove', handleMouseMove);
      anchorElem.removeEventListener('mouseleave', handleMouseLeave);
      anchorElem.removeEventListener('dragstart', handleDragStart);
      anchorElem.removeEventListener('dragend', handleDragEnd);
      unregisterDragOver();
      unregisterDrop();
      clearPushedMargin();
    };
  }, [editor, anchorElem, toAnchorSpace]);

  const lineTop = dropIndicator?.lineTop ?? null;
  const highlightTop = dropIndicator?.highlightTop ?? null;
  const highlightHeight = dropIndicator?.highlightHeight ?? null;

  return (
    <>
      {hoveredBlock && (
        <BlockDragHandle
          ref={handleRef}
          top={hoveredBlock.top}
          height={hoveredBlock.height}
        />
      )}
      {lineTop !== null && <BlockDropIndicator top={lineTop} />}
      <BlockDropHighlight top={highlightTop} height={highlightHeight} />
    </>
  );
};
