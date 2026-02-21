import { useMemo, useState, type ReactNode } from 'react';
import {
  useSortable,
  useListFilter,
  useTableLayout,
  useColumnResize,
} from '@/hooks';
import type { LayoutColumn } from '@/domain/table-config';
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

export type ColumnOverride<T extends Record<string, unknown>> = {
  key: keyof T & string;
  compareFn?: (a: T, b: T) => number;
  render?: (item: T) => ReactNode;
};

export type ListColumn<T extends Record<string, unknown>> = {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  resizable?: boolean;
  width: number;
  compareFn?: (a: T, b: T) => number;
  render?: (item: T) => ReactNode;
};

type SortableListProps<T extends Record<string, unknown>> = {
  tableName: string;
  items: T[];
  columnOverrides?: ColumnOverride<T>[];
  onRowClick: (item: T) => void;
  onCreateNew?: () => void;
  className?: string;
  searchPlaceholder?: string;
};

const buildColumns = <T extends Record<string, unknown>>(
  layoutColumns: LayoutColumn[],
  overrides?: ColumnOverride<T>[],
): ListColumn<T>[] => {
  const overrideMap = new Map(overrides?.map((o) => [o.key, o]));

  return layoutColumns.map((lc) => {
    const override = overrideMap.get(lc.key as keyof T & string);
    return {
      key: lc.key as keyof T & string,
      label: lc.label,
      sortable: lc.sortable,
      resizable: lc.resizable,
      width: lc.width,
      compareFn: override?.compareFn,
      render: override?.render,
    };
  });
};

export const SortableList = <T extends Record<string, unknown>>({
  tableName,
  items,
  columnOverrides,
  onRowClick,
  onCreateNew,
  className,
  searchPlaceholder,
}: SortableListProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    columns: layoutColumns,
    sortState: persistedSort,
    searchableColumns,
    updateColumnWidths,
    updateSortState,
  } = useTableLayout(tableName);

  const columns = useMemo(
    () => buildColumns<T>(layoutColumns, columnOverrides),
    [layoutColumns, columnOverrides],
  );

  const persistedWidths = useMemo(() => {
    const result: Record<string, number> = {};
    for (const col of layoutColumns) {
      result[col.key] = col.width;
    }
    return result;
  }, [layoutColumns]);

  const resizeColumns = useMemo(
    () =>
      columns.map((col) => ({
        key: col.key,
        defaultWidth: col.width,
        resizable: col.resizable,
      })),
    [columns],
  );

  const { gridTemplateColumns, handleResizeStart } = useColumnResize({
    columns: resizeColumns,
    persistedWidths,
    onResizeEnd: updateColumnWidths,
  });

  const sortableColumns = useMemo(
    () =>
      columns
        .filter((col) => col.sortable !== false)
        .map((col) => ({ key: col.key, compareFn: col.compareFn })),
    [columns],
  );

  const firstSortableKey =
    sortableColumns[0]?.key ?? (columns[0]?.key as keyof T & string);

  const defaultSort = persistedSort
    ? {
        column: persistedSort.column as keyof T & string,
        direction: persistedSort.direction,
      }
    : { column: firstSortableKey, direction: 'desc' as const };

  const sortConfig = {
    defaultSort,
    columns: sortableColumns,
    onSortChange: (state: {
      column: keyof T & string;
      direction: 'asc' | 'desc';
    }) => {
      updateSortState(state.column, state.direction);
    },
  };

  const filterConfig = useMemo(
    () => ({
      searchableColumns: searchableColumns as Array<keyof T & string>,
    }),
    [searchableColumns],
  );

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

  const headerColumns = useMemo(
    () =>
      columns.map(({ key, label, sortable, resizable }) => ({
        key,
        label,
        sortable,
        resizable,
      })),
    [columns],
  );

  const isSearching = searchTerm.trim().length > 0;
  const hasFieldMatches = sortedFieldMatches.length > 0;
  const hasNothingToShow =
    isSearching &&
    sortedNameMatches.length === 0 &&
    sortedFieldMatches.length === 0;
  const showCreateNewBtn = !!onCreateNew && (!isSearching || hasNothingToShow);

  const listStyle = {
    '--list-col-template': gridTemplateColumns,
  } as React.CSSProperties;

  return (
    <GlassPanel className={cn('sortable-list', className)} style={listStyle}>
      <SearchInput onSearch={setSearchTerm} placeholder={searchPlaceholder} />
      <SortingTableHeader<T>
        columns={headerColumns}
        sortState={sortState}
        onSort={toggleSort}
        onResizeStart={handleResizeStart}
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
