import { useEffect, useState, useRef, useMemo } from 'react';
import { ChevronUpIcon } from 'lucide-react';
import ActionContainer from '../../ActionContainer/ActionContainer';
import { useTableConfig } from '@/data-access-layer/table-config';
import './SortingTableHeader.css';
import { cn } from '@/util';

const MIN_COLUMN_WIDTH = 60;
const DEFAULT_COLUMN_WIDTH = 150;

type SortingTableHeaderProps = {
  tableName: string;
  className?: string;
};

const buildGridTemplate = (
  columnKeys: string[],
  widths: Record<string, number>,
): string => {
  const lastIndex = columnKeys.length - 1;
  return columnKeys
    .map((key, index) => {
      const width = widths[key] ?? DEFAULT_COLUMN_WIDTH;
      return index === lastIndex ? `minmax(${width}px, 1fr)` : `${width}px`;
    })
    .join(' ');
};

export const SortingTableHeader = ({
  tableName,
  className = '',
}: SortingTableHeaderProps) => {
  const { getConfigForTable, updateColumnWidths, updateSortState } = useTableConfig();

  const layout = getConfigForTable(tableName).layout;

  const sortState = layout.sort_state;
  const columns = layout.columns;

  const persistedWidths = useMemo(() => {
    const result: Record<string, number> = {};
    for (const col of columns) {
      result[col.key] = col.width;
    }
    return result;
  }, [columns]);

  const [activeWidths, setActiveWidths] = useState<Record<string, number>>(persistedWidths);

  const dragRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const updateColumnWidthsRef = useRef(updateColumnWidths);
  updateColumnWidthsRef.current = updateColumnWidths;

  const columnKeys = useMemo(() => columns.map((c) => c.key), [columns]);
  const columnKeysRef = useRef(columnKeys);
  columnKeysRef.current = columnKeys;

  useEffect(() => {
    if (!dragRef.current) {
      setActiveWidths(persistedWidths);
    }
  }, [persistedWidths]);

  const gridTemplate = useMemo(
    () => buildGridTemplate(columnKeys, activeWidths),
    [columnKeys, activeWidths],
  );

  const handleSort = (columnKey: string) => {
    const currentDirection = sortState.column === columnKey ? sortState.direction : null;
    const nextDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    updateSortState(tableName, columnKey, nextDirection);
  };

  const handleResizeStart = (columnKey: string, startX: number) => {
    const col = columns.find((c) => c.key === columnKey);
    if (col?.resizable === false) return;

    const startWidth = activeWidths[columnKey] ?? MIN_COLUMN_WIDTH;
    dragRef.current = { columnKey, startX, startWidth };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const newWidth = Math.max(
        MIN_COLUMN_WIDTH,
        dragRef.current.startWidth + delta,
      );
      setActiveWidths((prev) => ({
        ...prev,
        [dragRef.current!.columnKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      dragRef.current = null;

      setActiveWidths((current) => {
        const resizableWidths: Record<string, number> = {};
        for (const key of columnKeysRef.current) {
          const colDef = columns.find((c) => c.key === key);
          if (colDef?.resizable !== false) {
            resizableWidths[key] = current[key] ?? DEFAULT_COLUMN_WIDTH;
          }
        }
        updateColumnWidthsRef.current(tableName, resizableWidths);
        return current;
      });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn('sorting-table-header', className)}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {columns.map((column) => {
        const isActive = sortState.column === column.key;
        const notSortable = column?.sortable === false;
        const isResizable = column.resizable !== false;

        return (
          <div key={column.key} className='sorting-table-header__cell'>
            <ActionContainer
              disabled={notSortable}
              onClick={() => handleSort(column.key)}
              label={`Sort by ${column.label.toLowerCase()}`}
              className='sorting-table-header__sort-btn'
            >
              <span>{column.label}</span>
              <ChevronUpIcon
                className={cn(
                  'sort-indicator',
                  !isActive && 'sort-indicator__inactive',
                  sortState.direction === 'asc' && isActive && 'indicate-asc',
                )}
              />
            </ActionContainer>

            <div
              className={cn(
                'col-resize-drag-btn',
                isResizable && 'col-resizable',
              )}
              onMouseDown={
                isResizable
                  ? (e) => {
                      e.preventDefault();
                      handleResizeStart(column.key, e.clientX);
                    }
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
};
