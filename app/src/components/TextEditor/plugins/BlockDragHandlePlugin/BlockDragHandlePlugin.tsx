import { useEffect, useState } from 'react';
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
import { createMarginPush } from './helper/createMarginPush';
import {
  dropFeedbackPosition,
  type DropFeedbackPosition,
} from './helper/dropFeedbackPosition';
import { handleBlockKeyOf } from './helper/handleBlockKeyOf';
import { handleRowsOf } from './helper/handleRowsOf';
import { moveBlock } from './helper/moveBlock';
import { resolveDropTarget } from './helper/resolveDropTarget';
import { resolveHoveredRow } from './helper/resolveHoveredRow';
import {
  rowBoxInAnchorSpace,
  type AnchorBox,
} from './helper/rowBoxInAnchorSpace';
import { setDragImageOfRow } from './helper/setDragImageOfRow';
import { FCProps } from '@/types/fcProps.type';

// The only data type this drag puts in its drag data, so no other editor or input accepts the drop.
const DRAG_BLOCK_FORMAT = 'application/x-gm-block-drag';

type Props = {
  anchorElem: HTMLElement;
};

// One shown handle: the key of the block it moves and where it is drawn.
type HandleBox = AnchorBox & { key: NodeKey };

export const BlockDragHandlePlugin: FCProps<Props> = ({ anchorElem }) => {
  const [editor] = useLexicalComposerContext();
  const [handleBoxes, setHandleBoxes] = useState<HandleBox[]>([]);
  const [dropFeedback, setDropFeedback] = useState<DropFeedbackPosition | null>(
    null,
  );

  // The effect owns the drag state that is not rendered — the hovered row, the rows whose handles show and the dragged block's key — as closure variables, so the handlers share them without a render in between.
  useEffect(() => {
    let hoveredRow: BlockRow | null = null;
    let handleRows: BlockRow[] = [];
    let draggedKey: NodeKey | null = null;
    const marginPush = createMarginPush();

    const clearDrag = () => {
      draggedKey = null;
      marginPush.clear();
      setDropFeedback(null);
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (draggedKey !== null) return;
      // A parent's handle is as tall as its whole section, so the pointer on it is beside sub-items' rows and must keep the hovered row.
      if (handleBlockKeyOf(event.target) !== null) return;
      const rows = collectBlockRows(editor);
      const row = resolveHoveredRow(rows, event.clientY);
      if (row?.key === hoveredRow?.key) return;
      hoveredRow = row;
      handleRows = row === null ? [] : handleRowsOf(rows, row);
      const anchorRect = anchorElem.getBoundingClientRect();
      setHandleBoxes(
        handleRows.map((handleRow) => ({
          key: handleRow.key,
          ...rowBoxInAnchorSpace(anchorRect, handleRow),
        })),
      );
    };

    const handleMouseLeave = () => {
      if (draggedKey !== null) return;
      hoveredRow = null;
      handleRows = [];
      setHandleBoxes([]);
    };

    const handleDragStart = (event: DragEvent) => {
      const { dataTransfer } = event;
      const grabbedKey = handleBlockKeyOf(event.target);
      const grabbedRow =
        handleRows.find((row) => row.key === grabbedKey) ?? null;
      if (grabbedRow === null || dataTransfer === null) return;
      const { element, key } = grabbedRow;
      dataTransfer.setData(DRAG_BLOCK_FORMAT, key);
      dataTransfer.effectAllowed = 'move';
      setDragImageOfRow(dataTransfer, element);
      draggedKey = key;
    };

    const handleDragEnd = () => {
      clearDrag();
      editor.focus();
    };

    const handleDragOver = (event: DragEvent): boolean => {
      if (draggedKey === null) return false;
      const target = resolveDropTarget(
        collectBlockRows(editor),
        draggedKey,
        event.clientX,
        event.clientY,
      );
      if (target === null) {
        // No position here, as over the dragged block's own sub-items: nothing is marked and a release does nothing.
        marginPush.clear();
        setDropFeedback(null);
        return false;
      }
      // Lets the browser fire the drop event here.
      event.preventDefault();
      marginPush.push(target);
      // A new object on every dragover, so the highlight keeps tracking the row while the margin transition moves it.
      setDropFeedback(
        dropFeedbackPosition(anchorElem.getBoundingClientRect(), target),
      );
      return true;
    };

    const handleDrop = (event: DragEvent): boolean => {
      const droppedKey = draggedKey;
      if (droppedKey === null) return false;
      event.preventDefault();
      const target = resolveDropTarget(
        collectBlockRows(editor),
        droppedKey,
        event.clientX,
        event.clientY,
      );
      clearDrag();
      if (target !== null) {
        moveBlock(droppedKey, target.besideKey, target.placement, target.depth);
      }
      hoveredRow = null;
      handleRows = [];
      setHandleBoxes([]);
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
      marginPush.clear();
    };
  }, [editor, anchorElem]);

  return (
    <>
      {handleBoxes.map((box) => (
        <BlockDragHandle
          key={box.key}
          blockKey={box.key}
          top={box.top}
          blockLeft={box.left}
          height={box.unitHeight}
        />
      ))}
      {dropFeedback && (
        <>
          <BlockDropIndicator
            top={dropFeedback.lineTop}
            left={dropFeedback.lineLeft}
          />
          <BlockDropHighlight
            top={dropFeedback.highlightTop}
            left={dropFeedback.highlightLeft}
            height={dropFeedback.highlightHeight}
          />
        </>
      )}
    </>
  );
};
