import { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { ChevronUpIcon } from 'lucide-react';
import { ActionContainer } from '@/components';
import { useTableConfig } from '@/data-access-layer';
import './SortingTableHeader.css';
import { cn } from '@/util';
import { buildGridTemplate } from '../../helper';
import { DEFAULT_COLUMN_WIDTH } from '../../SortableList.constants';

const MIN_COLUMN_WIDTH = 60;

type SortingTableHeaderProps = {
  tableConfigId: string;
  className?: string;
  onDragWidthsChange: (widths: Record<string, number>) => void;
};

export const SortingTableHeader = ({
  tableConfigId,
  className = '',
  onDragWidthsChange,
}: SortingTableHeaderProps) => {
  const { config, updateColumnWidths, updateSortState } =
    useTableConfig(tableConfigId);

  const columns = config?.layout.columns ?? [];
  const sortState = config?.layout.sort_state ?? {
    column: '',
    direction: 'asc' as const,
  };

  const persistedWidths = useMemo(() => {
    const cols = config?.layout.columns ?? [];
    const result: Record<string, number> = {};
    for (const col of cols) {
      result[col.key] = col.width;
    }
    return result;
  }, [config?.layout.columns]);

  const [activeWidths, setActiveWidths] = useState(persistedWidths);

  const dragRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const updateColumnWidthsRef = useRef(updateColumnWidths);
  const onDragWidthsChangeRef = useRef(onDragWidthsChange);
  const activeWidthsRef = useRef(activeWidths);

  const columnKeys = useMemo(
    () => (config?.layout.columns ?? []).map((c) => c.key),
    [config?.layout.columns],
  );
  const columnKeysRef = useRef(columnKeys);

  // Keep refs in sync with latest values so drag event handlers never close over stale callbacks.
  // useLayoutEffect runs synchronously after commit and before browser paint, eliminating any
  // race between a render and a user interaction.
  useLayoutEffect(() => {
    updateColumnWidthsRef.current = updateColumnWidths;
    onDragWidthsChangeRef.current = onDragWidthsChange;
    activeWidthsRef.current = activeWidths;
    columnKeysRef.current = columnKeys;
  }, [updateColumnWidths, onDragWidthsChange, activeWidths, columnKeys]);

  // Syncs activeWidths with DB-persisted widths when config refreshes.
  // The dragRef guard prevents overwriting live drag state mid-drag.
  useEffect(() => {
    if (!dragRef.current) {
      setActiveWidths(persistedWidths); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [persistedWidths]);

  const gridTemplate = useMemo(
    () => buildGridTemplate(columnKeys, activeWidths),
    [columnKeys, activeWidths],
  );

  const handleSort = (columnKey: string) => {
    const currentDirection =
      sortState.column === columnKey ? sortState.direction : null;
    const nextDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    void updateSortState(columnKey, nextDirection);
  };

  const handleResizeStart = (columnKey: string, startX: number) => {
    const col = columns.find((c) => c.key === columnKey);
    if (col?.resizable === false) return;

    const startWidth = activeWidths[columnKey] ?? MIN_COLUMN_WIDTH;
    dragRef.current = { columnKey, startX, startWidth };

    const persistCurrentWidths = () => {
      setActiveWidths((current) => {
        const resizableWidths: Record<string, number> = {};
        for (const key of columnKeysRef.current) {
          const colDef = columns.find((c) => c.key === key);
          if (colDef?.resizable !== false) {
            resizableWidths[key] = current[key] ?? DEFAULT_COLUMN_WIDTH;
          }
        }
        void updateColumnWidthsRef.current(resizableWidths);
        return current;
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      const newWidth = Math.max(
        MIN_COLUMN_WIDTH,
        dragRef.current.startWidth + delta,
      );
      const nextWidths = {
        ...activeWidthsRef.current,
        [dragRef.current.columnKey]: newWidth,
      };
      activeWidthsRef.current = nextWidths;
      setActiveWidths(nextWidths);
      onDragWidthsChangeRef.current(nextWidths);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      dragRef.current = null;
      persistCurrentWidths();
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
        const notSortable = column.sortable === false;
        const isResizable = column.resizable !== false;

        return (
          <div key={column.key} className='sorting-table-header__cell'>
            <ActionContainer
              disabled={notSortable}
              onClick={() => {
                handleSort(column.key);
              }}
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
