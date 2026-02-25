import { useMemo, useState } from 'react';
import { useSortable, useListFilter } from '@/hooks';
import { useTableConfig } from '@/data-access-layer/table-config';
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

type SortableListProps<T extends Record<string, unknown>> = {
  tableName: string;
  items: T[];
  onRowClick: (item: T) => void;
  onCreateNew?: () => void;
  className?: string;
  searchPlaceholder?: string;
};

export const SortableList = <T extends Record<string, unknown>>({
  tableName,
  items,
  onRowClick,
  onCreateNew,
  className,
  searchPlaceholder,
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { getConfigForTable } = useTableConfig();
  const layout = getConfigForTable(tableName).layout;

  const sortableColumns = useMemo(
    () =>
      layout.columns
        .filter((col) => col.sortable !== false)
        .map((col) => ({ key: col.key as keyof T & string })),
    [layout.columns],
  );

  const filterConfig = useMemo(
    () => ({
      searchableColumns: layout.searchable_columns as Array<keyof T & string>,
    }),
    [layout.searchable_columns],
  );

  const { nameMatches, fieldMatches } = useListFilter<T>(
    items,
    searchTerm,
    filterConfig,
  );

  const sortedNameMatches = useSortable<T>(nameMatches, {
    sortState: layout.sort_state,
    columns: sortableColumns,
  });
  const sortedFieldMatches = useSortable<T>(fieldMatches, {
    sortState: layout.sort_state,
    columns: sortableColumns,
  });

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

      <SortingTableHeader tableName={tableName} />

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
              tableName={tableName}
              item={item}
              onClick={(item) => onRowClick(item as T)}
            />
          ))}

          {isSearching && hasFieldMatches && (
            <>
              <HorizontalDivider className='sortable-list__divider' />
              {sortedFieldMatches.map((item) => (
                <SortableListItem
                  key={item.id as string}
                  tableName={tableName}
                  item={item}
                  onClick={(item) => onRowClick(item as T)}
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
