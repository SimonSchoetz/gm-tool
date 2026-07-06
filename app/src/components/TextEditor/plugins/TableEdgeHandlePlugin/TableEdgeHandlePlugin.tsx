import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  getDOMCellFromTarget,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
} from '@lexical/table';
import { cn } from '@/util';
import { EditorPopup } from '../../components/EditorPopup';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { TableHandleMenu } from './components';
import './TableEdgeHandlePlugin.css';

type HintState = {
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  showTop: boolean;
  showBottom: boolean;
  showLeft: boolean;
  showRight: boolean;
  cellRect: DOMRect;
} | null;

type PopupState = {
  type: 'row' | 'column';
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  isHeader: boolean;
  hintElement: HTMLDivElement;
} | null;

type ActiveHint = 'top' | 'bottom' | 'left' | 'right' | null;

export const TableEdgeHandlePlugin = () => {
  const [editor] = useLexicalComposerContext();

  const [hintState, setHintState] = useState<HintState>(null);
  const [activeHint, setActiveHint] = useState<ActiveHint>(null);
  const [popupState, setPopupState] = useState<PopupState>(null);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPopupOpenRef = useRef(false);
  const topHintRef = useRef<HTMLDivElement | null>(null);
  const bottomHintRef = useRef<HTMLDivElement | null>(null);
  const leftHintRef = useRef<HTMLDivElement | null>(null);
  const rightHintRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isPopupOpenRef.current = popupState !== null;
  }, [popupState]);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setHintState(null);
      setActiveHint(null);
      hideTimerRef.current = null;
    }, 150);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleMouseMove = (event: MouseEvent) => {
      const cell = getDOMCellFromTarget(event.target as Node);
      if (!cell) {
        if (!isPopupOpenRef.current) scheduleHide();
        return;
      }
      const tableEl = cell.elem.closest('table');
      if (!tableEl) return;
      const observer = getTableObserverFromTableElement(tableEl);
      if (!observer) return;
      const table = observer.getTable();

      cancelHide();

      const isTop = cell.y === 0;
      const isBottom = cell.y === table.rows - 1;
      const isLeft = cell.x === 0;
      const isRight = cell.x === table.columns - 1;

      if (!isTop && !isBottom && !isLeft && !isRight) {
        if (!isPopupOpenRef.current) scheduleHide();
        return;
      }

      setHintState({
        cellX: cell.x,
        cellY: cell.y,
        tableElement: tableEl,
        showTop: isTop,
        showBottom: isBottom,
        showLeft: isLeft,
        showRight: isRight,
        cellRect: cell.elem.getBoundingClientRect(),
      });
    };

    const handleMouseLeave = () => {
      if (!isPopupOpenRef.current) scheduleHide();
    };

    rootElement.addEventListener('mousemove', handleMouseMove);
    rootElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      rootElement.removeEventListener('mousemove', handleMouseMove);
      rootElement.removeEventListener('mouseleave', handleMouseLeave);
      if (hideTimerRef.current !== null) clearTimeout(hideTimerRef.current);
    };
  }, [editor, scheduleHide, cancelHide]);

  useEffect(() => {
    if (!hintState || !activeHint) return;
    const { tableElement, cellX, cellY } = hintState;
    const observer = getTableObserverFromTableElement(tableElement);
    if (!observer) return;
    const table = observer.getTable();

    const cellElements: HTMLElement[] = [];
    if (activeHint === 'top' || activeHint === 'bottom') {
      table.domRows[cellY]?.forEach((cell) => {
        if (cell?.elem) cellElements.push(cell.elem);
      });
    } else {
      table.domRows.forEach((row) => {
        const cell = row?.[cellX];
        if (cell?.elem) cellElements.push(cell.elem);
      });
    }

    cellElements.forEach((el) => {
      el.classList.add('table-cell--handle-hover');
    });
    return () => {
      cellElements.forEach((el) => {
        el.classList.remove('table-cell--handle-hover');
      });
    };
  }, [activeHint, hintState]);

  const openPopup = (
    type: 'row' | 'column',
    hintRef: React.RefObject<HTMLDivElement | null>,
  ) => {
    if (!hintState || !hintRef.current) return;
    const { cellX, cellY, tableElement } = hintState;

    let isHeader = false;
    editor.read(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      if (type === 'row') {
        isHeader = Array.from({ length: table.columns }, (_, x) => {
          const node = tableNode.getCellNodeFromCords(x, cellY, table);
          return node?.hasHeaderState(TableCellHeaderStates.ROW) ?? false;
        }).every(Boolean);
      } else {
        isHeader = Array.from({ length: table.rows }, (_, y) => {
          const node = tableNode.getCellNodeFromCords(cellX, y, table);
          return node?.hasHeaderState(TableCellHeaderStates.COLUMN) ?? false;
        }).every(Boolean);
      }
    });

    setPopupState({
      type,
      cellX,
      cellY,
      tableElement,
      isHeader,
      hintElement: hintRef.current,
    });
  };

  const handleInsertRowAbove = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $insertTableRowAtSelection(false);
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleInsertRowBelow = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $insertTableRowAtSelection(true);
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleDeleteRow = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $deleteTableRowAtSelection();
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleInsertColumnLeft = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $insertTableColumnAtSelection(false);
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleInsertColumnRight = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $insertTableColumnAtSelection(true);
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleDeleteColumn = useCallback(() => {
    if (!popupState) return;
    const { cellX, cellY, tableElement } = popupState;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(tableElement);
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
      if (!cellNode) return;
      cellNode.selectStart();
      $deleteTableColumnAtSelection();
    });
    setPopupState(null);
  }, [editor, popupState]);

  const handleToggleHeaderRow = useCallback(() => {
    if (!popupState) return;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(
        popupState.tableElement,
      );
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const targetState = popupState.isHeader
        ? TableCellHeaderStates.NO_STATUS
        : TableCellHeaderStates.ROW;
      for (let x = 0; x < table.columns; x++) {
        tableNode
          .getCellNodeFromCords(x, popupState.cellY, table)
          ?.setHeaderStyles(targetState, TableCellHeaderStates.ROW);
      }
    });
    setPopupState((prev) => (prev ? { ...prev, isHeader: !prev.isHeader } : null));
  }, [editor, popupState]);

  const handleToggleHeaderColumn = useCallback(() => {
    if (!popupState) return;
    editor.update(() => {
      const observer = getTableObserverFromTableElement(
        popupState.tableElement,
      );
      if (!observer) return;
      const { tableNode } = observer.$lookup();
      const table = observer.getTable();
      const targetState = popupState.isHeader
        ? TableCellHeaderStates.NO_STATUS
        : TableCellHeaderStates.COLUMN;
      for (let y = 0; y < table.rows; y++) {
        tableNode
          .getCellNodeFromCords(popupState.cellX, y, table)
          ?.setHeaderStyles(targetState, TableCellHeaderStates.COLUMN);
      }
    });
    setPopupState((prev) => (prev ? { ...prev, isHeader: !prev.isHeader } : null));
  }, [editor, popupState]);

  return (
    <>
      {hintState &&
        createPortal(
          <>
            <div
              ref={topHintRef}
              className={cn(
                'table-edge-hint',
                'table-edge-hint--horizontal',
                activeHint === 'top' && 'table-edge-hint--active',
              )}
              style={{
                display: hintState.showTop ? undefined : 'none',
                left: hintState.cellRect.left + hintState.cellRect.width / 2 - 5,
                top: hintState.cellRect.top - 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => {
                cancelHide();
                setActiveHint('top');
              }}
              onMouseLeave={() => {
                if (!isPopupOpenRef.current) scheduleHide();
              }}
              onClick={() => {
                openPopup('row', topHintRef);
              }}
            />
            <div
              ref={bottomHintRef}
              className={cn(
                'table-edge-hint',
                'table-edge-hint--horizontal',
                activeHint === 'bottom' && 'table-edge-hint--active',
              )}
              style={{
                display: hintState.showBottom ? undefined : 'none',
                left: hintState.cellRect.left + hintState.cellRect.width / 2 - 5,
                top: hintState.cellRect.bottom - 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => {
                cancelHide();
                setActiveHint('bottom');
              }}
              onMouseLeave={() => {
                if (!isPopupOpenRef.current) scheduleHide();
              }}
              onClick={() => {
                openPopup('row', bottomHintRef);
              }}
            />
            <div
              ref={leftHintRef}
              className={cn(
                'table-edge-hint',
                'table-edge-hint--vertical',
                activeHint === 'left' && 'table-edge-hint--active',
              )}
              style={{
                display: hintState.showLeft ? undefined : 'none',
                left: hintState.cellRect.left - 1,
                top: hintState.cellRect.top + hintState.cellRect.height / 2 - 5,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => {
                cancelHide();
                setActiveHint('left');
              }}
              onMouseLeave={() => {
                if (!isPopupOpenRef.current) scheduleHide();
              }}
              onClick={() => {
                openPopup('column', leftHintRef);
              }}
            />
            <div
              ref={rightHintRef}
              className={cn(
                'table-edge-hint',
                'table-edge-hint--vertical',
                activeHint === 'right' && 'table-edge-hint--active',
              )}
              style={{
                display: hintState.showRight ? undefined : 'none',
                left: hintState.cellRect.right - 1,
                top: hintState.cellRect.top + hintState.cellRect.height / 2 - 5,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onMouseEnter={() => {
                cancelHide();
                setActiveHint('right');
              }}
              onMouseLeave={() => {
                if (!isPopupOpenRef.current) scheduleHide();
              }}
              onClick={() => {
                openPopup('column', rightHintRef);
              }}
            />
          </>,
          document.body,
        )}
      {popupState && (
        <EditorPopup
          getAnchorRect={() => popupState.hintElement.getBoundingClientRect()}
          onClickOutside={() => {
            setPopupState(null);
          }}
        >
          <GlassPanel>
            <TableHandleMenu
              type={popupState.type}
              isHeader={popupState.isHeader}
              onToggleHeader={
                popupState.type === 'row'
                  ? handleToggleHeaderRow
                  : handleToggleHeaderColumn
              }
              onInsertBefore={
                popupState.type === 'row'
                  ? handleInsertRowAbove
                  : handleInsertColumnLeft
              }
              onInsertAfter={
                popupState.type === 'row'
                  ? handleInsertRowBelow
                  : handleInsertColumnRight
              }
              onDelete={
                popupState.type === 'row' ? handleDeleteRow : handleDeleteColumn
              }
            />
          </GlassPanel>
        </EditorPopup>
      )}
    </>
  );
};
