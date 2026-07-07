import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  getDOMCellFromTarget,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
} from '@lexical/table';
import { EditorPopup } from '../../components/EditorPopup';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { TableHandleMenu, TableEdgeHint } from './components';
import './TableEdgeHandlePlugin.css';
import { CustomScrollArea } from '@/components/CustomScrollArea/CustomScrollArea';

export type HintDirection = 'top' | 'bottom' | 'left' | 'right';

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

export type PopupState = {
  type: 'row' | 'column';
  cellX: number;
  cellY: number;
  tableElement: HTMLTableElement;
  isHeader: boolean;
  hintElement: HTMLDivElement;
} | null;

type ActiveHint = HintDirection | null;

const HINT_TYPE: Record<HintDirection, 'row' | 'column'> = {
  top: 'column',
  bottom: 'column',
  left: 'row',
  right: 'row',
};

export const TableEdgeHandlePlugin = () => {
  const [editor] = useLexicalComposerContext();

  const [hintState, setHintState] = useState<HintState>(null);
  const [activeHint, setActiveHint] = useState<ActiveHint>(null);
  const [popupState, setPopupState] = useState<PopupState>(null);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPopupOpenRef = useRef(false);
  const isHintHoveredRef = useRef(false);

  useEffect(() => {
    isPopupOpenRef.current = popupState !== null;
  }, [popupState]);

  const closePopup = () => {
    setPopupState(null);
    setActiveHint(null);
    setHintState(null);
  };

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
      if (isPopupOpenRef.current) return;
      const cell = getDOMCellFromTarget(event.target as Node);
      if (!cell) {
        scheduleHide();
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
        scheduleHide();
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
      if (!isPopupOpenRef.current && !isHintHoveredRef.current) {
        scheduleHide();
      }
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
    if (HINT_TYPE[activeHint] === 'row') {
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

  const openPopup = (type: 'row' | 'column', element: HTMLDivElement) => {
    if (!hintState) return;
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
      hintElement: element,
    });
  };

  const handleHintMouseEnter = (direction: HintDirection) => {
    isHintHoveredRef.current = true;
    cancelHide();
    setActiveHint(direction);
  };

  const handleHintMouseLeave = () => {
    isHintHoveredRef.current = false;
    if (isPopupOpenRef.current) return;
    setActiveHint(null);
    scheduleHide();
  };

  return (
    <>
      {hintState &&
        createPortal(
          (
            [
              {
                direction: 'top',
                axisClass: 'horizontal',
                type: HINT_TYPE.top,
                show: hintState.showTop,
              },
              {
                direction: 'bottom',
                axisClass: 'horizontal',
                type: HINT_TYPE.bottom,
                show: hintState.showBottom,
              },
              {
                direction: 'left',
                axisClass: 'vertical',
                type: HINT_TYPE.left,
                show: hintState.showLeft,
              },
              {
                direction: 'right',
                axisClass: 'vertical',
                type: HINT_TYPE.right,
                show: hintState.showRight,
              },
            ] as const
          ).map((cfg) => (
            <TableEdgeHint
              key={cfg.direction}
              direction={cfg.direction}
              axisClass={cfg.axisClass}
              type={cfg.type}
              show={cfg.show}
              active={activeHint === cfg.direction}
              cellRect={hintState.cellRect}
              onMouseEnter={handleHintMouseEnter}
              onMouseLeave={handleHintMouseLeave}
              onClick={openPopup}
            />
          )),
          document.body,
        )}
      {popupState && (
        <EditorPopup
          getAnchorRect={() => popupState.hintElement.getBoundingClientRect()}
          onClickOutside={() => {
            closePopup();
          }}
        >
          <GlassPanel className='TEP-container'>
            <CustomScrollArea className='table-popup-list TEP-scroll-area'>
              <TableHandleMenu
                popupState={popupState}
                setPopupState={setPopupState}
                closePopup={closePopup}
              />
            </CustomScrollArea>
          </GlassPanel>
        </EditorPopup>
      )}
    </>
  );
};
