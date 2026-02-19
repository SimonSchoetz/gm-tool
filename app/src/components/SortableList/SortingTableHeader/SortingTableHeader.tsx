import { ChevronUpIcon } from 'lucide-react';
import ActionContainer from '../../ActionContainer/ActionContainer';
import type { SortState } from '@/hooks';
import './SortingTableHeader.css';
import { cn } from '@/util';

type ColumnConfig<T> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
};

type SortingTableHeaderProps<T> = {
  columns: ColumnConfig<T>[];
  sortState: SortState<T>;
  onSort: (column: keyof T & string) => void;
  className?: string;
};

export const SortingTableHeader = <T,>({
  columns,
  sortState,
  onSort,
  className = '',
}: SortingTableHeaderProps<T>) => {
  return (
    <div className={cn(`sorting-table-header`, className)}>
      {columns.map((column) => {
        const isActive = sortState.column === column.key;
        const isSortable = column.sortable !== false;

        if (!isSortable) {
          return (
            <div className='sorting-table-header__cell'>
              <span key={column.key}>{column.label}</span>

              <ChevronUpIcon // This is here as a placeholder for consistent styling
                className={cn('sort-indicator', 'sort-indicator__inactive')}
              />
            </div>
          );
        }

        return (
          <ActionContainer
            key={column.key}
            className='sorting-table-header__cell'
            onClick={() => onSort(column.key)}
            label={`Sort by ${column.label.toLowerCase()}`}
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
        );
      })}
    </div>
  );
};
