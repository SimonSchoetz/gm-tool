import { useState, useEffect, useRef, useMemo } from 'react';

const MIN_COLUMN_WIDTH = 60;
const DEFAULT_COLUMN_WIDTH = 150;

type ColumnDef = {
  key: string;
  defaultWidth?: number;
  resizable?: boolean;
};

type UseColumnResizeConfig = {
  columns: ColumnDef[];
  persistedWidths: Record<string, number>;
  onResizeEnd: (widths: Record<string, number>) => void;
};

const buildInitialWidths = (
  columns: ColumnDef[],
  persistedWidths: Record<string, number>,
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const col of columns) {
    const isFixed = col.resizable === false;
    result[col.key] = isFixed
      ? (col.defaultWidth ?? DEFAULT_COLUMN_WIDTH)
      : (persistedWidths[col.key] ?? col.defaultWidth ?? DEFAULT_COLUMN_WIDTH);
  }
  return result;
};

const filterResizableWidths = (
  widths: Record<string, number>,
  columns: ColumnDef[],
): Record<string, number> => {
  const fixedKeys = new Set(
    columns
      .filter((col) => col.resizable === false)
      .map((col) => col.key),
  );
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(widths)) {
    if (!fixedKeys.has(key)) {
      result[key] = value;
    }
  }
  return result;
};

export const useColumnResize = ({
  columns,
  persistedWidths,
  onResizeEnd,
}: UseColumnResizeConfig) => {
  const [activeWidths, setActiveWidths] = useState<Record<string, number>>(
    () => buildInitialWidths(columns, persistedWidths),
  );

  const dragRef = useRef<{
    columnKey: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const onResizeEndRef = useRef(onResizeEnd);
  onResizeEndRef.current = onResizeEnd;

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    if (!dragRef.current) {
      setActiveWidths(buildInitialWidths(columns, persistedWidths));
    }
  }, [persistedWidths, columns]);

  const handleResizeStart = (columnKey: string, startX: number) => {
    const columnDef = columnsRef.current.find((col) => col.key === columnKey);
    if (columnDef?.resizable === false) return;

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
        onResizeEndRef.current(
          filterResizableWidths(current, columnsRef.current),
        );
        return current;
      });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const gridTemplateColumns = useMemo(() => {
    const lastIndex = columns.length - 1;
    return columns
      .map((col, index) => {
        const width = activeWidths[col.key] ?? DEFAULT_COLUMN_WIDTH;
        if (index === lastIndex) {
          return `minmax(${width}px, 1fr)`;
        }
        return `${width}px`;
      })
      .join(' ');
  }, [columns, activeWidths]);

  return {
    activeWidths,
    gridTemplateColumns,
    handleResizeStart,
  };
};
