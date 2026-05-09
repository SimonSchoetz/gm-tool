import z from 'zod';
import { tableConfigTable } from './schema';
import type { LayoutColumn, SortDirection, TableLayout } from './layout-schema';

type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

export type TableConfig = Omit<TableConfigRow, 'layout'> & {
  layout: TableLayout;
};

export type CreateTableConfigInput = {
  table_name: string;
  color: string;
  layout: TableLayout;
  tagging_enabled?: number;
  scope?: 'adventure' | 'global';
};

export type UpdateTableConfigInput = Omit<
  z.infer<typeof tableConfigTable.updateSchema>,
  'layout'
> & { layout?: TableLayout };

export type TypedTableLayout<T> = {
  searchable_columns: (keyof T & string)[];
  columns: (Omit<LayoutColumn, 'key'> & { key: keyof T & string })[];
  sort_state: { column: keyof T & string; direction: SortDirection };
};

export type TypedCreateTableConfigInput<T> = Omit<
  CreateTableConfigInput,
  'layout'
> & {
  layout: TypedTableLayout<T>;
};
