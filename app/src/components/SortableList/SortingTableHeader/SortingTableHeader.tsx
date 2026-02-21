import { ChevronUpIcon } from 'lucide-react';
import ActionContainer from '../../ActionContainer/ActionContainer';
import type { SortState } from '@/hooks';
import './SortingTableHeader.css';
import { cn } from '@/util';

type ColumnConfig<T> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  resizable?: boolean;
};

type SortingTableHeaderProps<T> = {
  columns: ColumnConfig<T>[];
  sortState: SortState<T>;
  onSort: (column: keyof T & string) => void;
  onResizeStart: (columnKey: string, startX: number) => void;
  className?: string;
};

export const SortingTableHeader = <T,>({
  columns,
  sortState,
  onSort,
  onResizeStart,
  className = '',
}: SortingTableHeaderProps<T>) => {
  return (
    <div className={cn(`sorting-table-header`, className)}>
      {columns.map((column) => {
        const isActive = sortState.column === column.key;
        const notSortable = column?.sortable === false;

        const isResizable = column.resizable !== false;

        return (
          <div key={column.key} className='sorting-table-header__cell'>
            <ActionContainer
              disabled={notSortable}
              onClick={() => onSort(column.key)}
              label={`Sort by ${column.label.toLowerCase()}`}
              className='sorting-table-header__sort-btn'
            >
              <span>{column.label}</span>
              <ChevronUpIcon
                className={cn(
                  'sort-indicator',
                  !isActive && 'sort-indicator__inactive',
                  sortState.direction === 'asc' && 'indicate-asc',
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
                      onResizeStart(column.key, e.clientX);
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
