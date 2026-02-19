import { useState, type ReactNode } from 'react';
import { useSortable, useListFilter } from '@/hooks';
import { cn } from '@/util';
import {
  GlassPanel,
  SearchInput,
  CustomScrollArea,
  NewItemBtn,
  HorizontalDivider,
} from '@/components';
import './SortableList.css';
import { SortableListItem } from './SortableListItem/SortableListItem';
import { SortingTableHeader } from './SortingTableHeader/SortingTableHeader';

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
  className?: string;
  searchPlaceholder?: string;
};

export const SortableList = <T extends Record<string, unknown>>({
  items,
  columns,
  filterConfig,
  defaultSortColumn = 'updated_at',
  onRowClick,
  onCreateNew,
  className,
  searchPlaceholder,
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  const sortableColumns = columns
    .filter((col) => col.sortable !== false)
    .map((col) => ({ key: col.key, compareFn: col.compareFn }));

  const firstSortableKey =
    sortableColumns[0]?.key ?? (columns[0].key as keyof T & string);
  const resolvedDefaultSort = defaultSortColumn ?? firstSortableKey;
  console.log(resolvedDefaultSort);
  const sortConfig = {
    defaultSort: { column: resolvedDefaultSort, direction: 'desc' as const },
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

  const headerColumns = columns.map(({ key, label, sortable }) => ({
    key,
    label,
    sortable,
  }));

  const isSearching = searchTerm.trim().length > 0;
  const hasFieldMatches = sortedFieldMatches.length > 0;
  const hasNothingToShow =
    isSearching &&
    sortedNameMatches.length === 0 &&
    sortedFieldMatches.length === 0;
  const showCreateNewBtn = !!onCreateNew && (!isSearching || hasNothingToShow);

  return (
    <GlassPanel className={cn('sortable-list', className)}>
      <SearchInput onSearch={setSearchTerm} placeholder={searchPlaceholder} />
      <SortingTableHeader<T>
        columns={headerColumns}
        sortState={sortState}
        onSort={toggleSort}
        className='sortable-list__head'
      />
      <CustomScrollArea>
        <ul className='sortable-list__table'>
          {showCreateNewBtn && (
            <li key='new-item-button'>
              <NewItemBtn type='list-item' label='+' onClick={onCreateNew} />
            </li>
          )}

          {sortedNameMatches.map((item) => (
            <SortableListItem
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
                <SortableListItem
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
