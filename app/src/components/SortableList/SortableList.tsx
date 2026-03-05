import { useEffect, useMemo, useState } from 'react';
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
import { SortableListItem, SortingTableHeader } from './components';

type SortableListProps<T extends Record<string, unknown> & { id: string }> = {
  tableConfigId: string;
  items: T[];
  onRowClick: (item: T) => void;
  onCreateNew?: () => void;
  className?: string;
  searchPlaceholder?: string;
};

export const SortableList = <T extends Record<string, unknown> & { id: string }>({
  tableConfigId,
  items,
  onRowClick,
  onCreateNew,
  className,
  searchPlaceholder,
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragWidths, setDragWidths] = useState<Record<string, number> | null>(null);
  const { config } = useTableConfig(tableConfigId);

  const columns = config?.layout.columns ?? [];
  const sortState = config?.layout.sort_state ?? { column: '', direction: 'asc' as const };

  const sortableColumns = useMemo(
    () =>
      columns
        .filter((col) => col.sortable !== false)
        .map((col) => ({ key: col.key as keyof T & string })),
    [columns],
  );

  const filterConfig = useMemo(
    () => ({
      searchableColumns: (config?.layout.searchable_columns ?? []) as Array<keyof T & string>,
    }),
    [config?.layout.searchable_columns],
  );

  const { nameMatches, fieldMatches } = useListFilter<T>(
    items,
    searchTerm,
    filterConfig,
  );

  const sortedNameMatches = useSortable<T>(nameMatches, {
    sortState,
    columns: sortableColumns,
  });
  const sortedFieldMatches = useSortable<T>(fieldMatches, {
    sortState,
    columns: sortableColumns,
  });

  // Clear live drag widths once config refreshes from DB after mouseup
  useEffect(() => {
    setDragWidths(null);
  }, [config]);

  // All hooks called — safe to return early
  if (!config) return null;

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

      <SortingTableHeader tableConfigId={tableConfigId} onDragWidthsChange={setDragWidths} />

      <CustomScrollArea>
        <ul className='sortable-list__table'>
          {showCreateNewBtn && (
            <li key='new-item-button'>
              <NewItemBtn type='list-item' label='+' onClick={onCreateNew} />
            </li>
          )}

          {sortedNameMatches.map((item) => (
            <SortableListItem
              key={item.id}
              tableConfigId={tableConfigId}
              item={item}
              onClick={(item) => onRowClick(item as T)}
              dragWidths={dragWidths}
            />
          ))}

          {isSearching && hasFieldMatches && (
            <>
              <HorizontalDivider className='sortable-list__divider' />
              {sortedFieldMatches.map((item) => (
                <SortableListItem
                  key={item.id}
                  tableConfigId={tableConfigId}
                  item={item}
                  onClick={(item) => onRowClick(item as T)}
                  dragWidths={dragWidths}
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
