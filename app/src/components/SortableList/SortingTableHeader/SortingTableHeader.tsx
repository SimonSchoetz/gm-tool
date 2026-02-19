import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import ActionContainer from '../../ActionContainer/ActionContainer';
import type { SortDirection, SortState } from '@/hooks';
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

const SortIcon = ({ direction }: { direction: SortDirection }) =>
  direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />;

export const SortingTableHeader = <T,>({
  columns,
  sortState,
  onSort,
  className = '',
}: SortingTableHeaderProps<T>) => {
  return (
    <div className={cn(`sortable-table-header`, className)}>
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
