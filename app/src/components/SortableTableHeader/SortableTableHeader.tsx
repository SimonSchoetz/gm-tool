import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import ActionContainer from '../ActionContainer/ActionContainer';
import type { SortDirection, SortState } from '@/hooks';
import './SortableTableHeader.css';

type ColumnConfig<T> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
};

type SortableTableHeaderProps<T> = {
  columns: ColumnConfig<T>[];
  sortState: SortState<T>;
  onSort: (column: keyof T & string) => void;
  className?: string;
};

const SortIcon = ({ direction }: { direction: SortDirection }) =>
  direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;

export const SortableTableHeader = <T,>({
  columns,
  sortState,
  onSort,
  className = '',
}: SortableTableHeaderProps<T>) => {
  return (
    <div className={`sortable-table-header ${className}`}>
      {columns.map((column) => {
        const isActive = sortState.column === column.key;
        const isSortable = column.sortable !== false;

        if (!isSortable) {
          return (
            <div key={column.key} className='sortable-table-header__cell'>
              {column.label}
            </div>
          );
        }

        return (
          <ActionContainer
            key={column.key}
            className='sortable-table-header__cell sortable-table-header__cell--sortable'
            onClick={() => onSort(column.key)}
            label={`Sort by ${column.label.toLowerCase()}`}
          >
            <span>{column.label}</span>
            {isActive && <SortIcon direction={sortState.direction} />}
          </ActionContainer>
        );
      })}
    </div>
  );
};
