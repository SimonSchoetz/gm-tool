import { useEffect, useMemo, useState } from 'react';
import { useSortable, useListFilter } from '@/hooks';
import { useTableConfig } from '@/data-access-layer';
import { cn } from '@/util';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { SearchInput } from '../SearchInput/SearchInput';
import { CustomScrollArea } from '../CustomScrollArea';
import { NewItemBtn } from '../NewItemBtn/NewItemBtn';
import { HorizontalDivider } from '../HorizontalDivider';
import './SortableList.css';
import { SortableListItem, SortingTableHeader } from './components';
import { partitionPinnedItems } from './helper';

type SortableListProps<T extends Record<string, unknown> & { id: string }> = {
  tableConfigId: string;
  items: T[];
  onRowClick: (item: T) => void;
  onCreateNew?: () => void;
  className?: string;
  searchPlaceholder?: string;
};

export const SortableList = <
  T extends Record<string, unknown> & { id: string },
>({
  tableConfigId,
  items,
  onRowClick,
  onCreateNew,
  className,
  searchPlaceholder = 'Search...',
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dragWidths, setDragWidths] = useState<Record<string, number> | null>(
    null,
  );
  const { config } = useTableConfig(tableConfigId);

  const sortState = config?.layout.sort_state ?? {
    column: '',
    direction: 'asc' as const,
  };

  const sortableColumns = useMemo(
    () =>
      (config?.layout.columns ?? [])
        .filter((col) => col.sortable !== false)
        .map((col) => ({ key: col.key })),
    [config?.layout.columns],
  );

  const filterConfig = useMemo(
    () => ({
      searchableColumns: config?.layout.searchable_columns ?? [],
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

  // Clear live drag widths once config refreshes from DB after mouseup.
  // dragWidths is transient drag state that cannot be derived from config.
  useEffect(() => {
    setDragWidths(null); // eslint-disable-line react-hooks/set-state-in-effect
  }, [config]);

  // All hooks called — safe to return early
  if (!config) return;

  const isSearching = searchTerm.trim().length > 0;
  const hasFieldMatches = sortedFieldMatches.length > 0;
  const hasNothingToShow =
    isSearching &&
    sortedNameMatches.length === 0 &&
    sortedFieldMatches.length === 0;
  const showCreateNewBtn = !!onCreateNew && (!isSearching || hasNothingToShow);
  const { pinnedItems, unpinnedItems } = isSearching
    ? { pinnedItems: [], unpinnedItems: sortedNameMatches }
    : partitionPinnedItems(sortedNameMatches);

  const handleRowClick = (item: Record<string, unknown>) => {
    onRowClick(item as T);
  };

  return (
    <GlassPanel className={cn('sortable-list', className)}>
      <div className='sortable-list--header'>
        <SearchInput onSearch={setSearchTerm} placeholder={searchPlaceholder} />

        <SortingTableHeader
          tableConfigId={tableConfigId}
          onDragWidthsChange={setDragWidths}
        />
      </div>

      <CustomScrollArea className='sortable-list--scroll-area'>
        <ul className='sortable-list--table'>
          {showCreateNewBtn && (
            <li key='new-item-button'>
              <NewItemBtn label='Create new item' onClick={onCreateNew} />
            </li>
          )}

          {pinnedItems.length > 0 && (
            <>
              <li
                key='sortable-list--pinned-heading'
                className='sortable-list--section-heading label'
              >
                Pinned
              </li>
              {pinnedItems.map((item) => (
                <SortableListItem
                  key={item.id}
                  tableConfigId={tableConfigId}
                  item={item}
                  onClick={handleRowClick}
                  dragWidths={dragWidths}
                />
              ))}

              <li
                className='sortable-list--divider-li'
                key='sortable-list--pinned-divider'
              >
                <HorizontalDivider />
              </li>
            </>
          )}

          {unpinnedItems.map((item) => (
            <SortableListItem
              key={item.id}
              tableConfigId={tableConfigId}
              item={item}
              onClick={handleRowClick}
              dragWidths={dragWidths}
            />
          ))}

          {isSearching && hasFieldMatches && (
            <>
              <li
                className='sortable-list--divider-li'
                key='sortable-list--field-divider'
              >
                <HorizontalDivider />
              </li>
              {sortedFieldMatches.map((item) => (
                <SortableListItem
                  key={item.id}
                  tableConfigId={tableConfigId}
                  item={item}
                  onClick={handleRowClick}
                  dragWidths={dragWidths}
                />
              ))}
            </>
          )}

          {hasNothingToShow && (
            <li
              key='sortable-list--no-results'
              className='sortable-list--no-results'
            >
              No results found
            </li>
          )}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};
