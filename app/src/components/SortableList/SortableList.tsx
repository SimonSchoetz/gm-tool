import { useState, type ReactNode } from 'react';
import { useSortable, useListFilter } from '@/hooks';
import { cn } from '@/util';
import {
  GlassPanel,
  SearchInput,
  SortableTableHeader,
  CustomScrollArea,
  NewItemBtn,
  HorizontalDivider,
} from '@/components';
import './SortableList.css';

export type ListColumn<T extends Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  compareFn?: (a: T, b: T) => number;
  render?: (item: T) => ReactNode;
};

type SortableListProps<T extends Record<string, unknown>> = {
  items: T[];
  columns: ListColumn<T>[];
  filterConfig: {
    searchableColumns: Array<keyof T & string>;
  };
  defaultSortColumn?: keyof T & string;
  onRowClick: (item: T) => void;
  onCreateNew?: () => void;
  searchPlaceholder?: string;
  className?: string;
};

type ListRowProps<T extends Record<string, unknown>> = {
  item: T;
  columns: ListColumn<T>[];
  onClick: (item: T) => void;
};

const ListRow = <T extends Record<string, unknown>>({
  item,
  columns,
  onClick,
}: ListRowProps<T>) => (
  <li>
    <GlassPanel intensity='bright'>
      <ul className='sortable-list__row' onClick={() => onClick(item)}>
        {columns.map((col) => (
          <li key={col.key}>
            {col.render ? col.render(item) : String(item[col.key] ?? '')}
          </li>
        ))}
      </ul>
    </GlassPanel>
  </li>
);

export const SortableList = <T extends Record<string, unknown>>({
  items,
  columns,
  filterConfig,
  defaultSortColumn,
  onRowClick,
  onCreateNew,
  searchPlaceholder,
  className,
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortableColumns = columns
    .filter((col) => col.sortable !== false)
    .map((col) => ({ key: col.key, compareFn: col.compareFn }));

  const firstSortableKey =
    sortableColumns[0]?.key ?? (columns[0].key as keyof T & string);
  const resolvedDefaultSort = defaultSortColumn ?? firstSortableKey;

  const sortConfig = {
    defaultSort: { column: resolvedDefaultSort, direction: 'asc' as const },
    columns: sortableColumns,
  };

  const { nameMatches, fieldMatches } = useListFilter<T>(
    items,
    searchTerm,
    filterConfig,
  );

  const {
    sortedItems: sortedNameMatches,
    sortState,
    toggleSort,
  } = useSortable<T>(nameMatches, sortConfig);

  const { sortedItems: sortedFieldMatches } = useSortable<T>(
    fieldMatches,
    sortConfig,
  );

  const isSearching = searchTerm.trim().length > 0;
  const hasFieldMatches = sortedFieldMatches.length > 0;
  const hasNothingToShow =
    isSearching &&
    sortedNameMatches.length === 0 &&
    sortedFieldMatches.length === 0;

  const headerColumns = columns.map(({ key, label, sortable }) => ({
    key,
    label,
    sortable,
  }));

  return (
    <GlassPanel className={cn('sortable-list', className)}>
      <SearchInput onSearch={setSearchTerm} placeholder={searchPlaceholder} />
      <SortableTableHeader<T>
        columns={headerColumns}
        sortState={sortState}
        onSort={toggleSort}
        className='sortable-list__head'
      />
      <CustomScrollArea>
        <ul className='sortable-list__table'>
          {!isSearching && onCreateNew && (
            <li key='new-item-button'>
              <NewItemBtn type='list-item' label='+' onClick={onCreateNew} />
            </li>
          )}
          {sortedNameMatches.map((item) => (
            <ListRow
              key={item.id as string}
              item={item}
              columns={columns}
              onClick={onRowClick}
            />
          ))}
          {isSearching && hasFieldMatches && (
            <>
              <HorizontalDivider className='sortable-list__divider' />
              {sortedFieldMatches.map((item) => (
                <ListRow
                  key={item.id as string}
                  item={item}
                  columns={columns}
                  onClick={onRowClick}
                />
              ))}
            </>
          )}
          {hasNothingToShow && (
            <li className='sortable-list__no-results'>No results found</li>
          )}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};
