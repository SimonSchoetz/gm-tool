import z from 'zod';
import { tableConfigTable } from './schema';
import type { LayoutColumn, SortDirection, TableLayout } from './layout-schema';

// Raw row type — what the SQLite driver returns. Internal to the DB layer only.
type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

// Public type — layout is already parsed. Used everywhere outside the DB layer.
export type TableConfig = Omit<TableConfigRow, 'layout'> & { layout: TableLayout };

export type CreateTableConfigInput = Omit<
  z.infer<typeof tableConfigTable.createSchema>,
  'layout'
> & { layout: TableLayout };

export type UpdateTableConfigInput = Omit<
  z.infer<typeof tableConfigTable.updateSchema>,
  'layout'
> & { layout?: TableLayout };

export type TypedTableLayout<T> = {
  searchable_columns: (keyof T & string)[];
  columns: (Omit<LayoutColumn, 'key'> & { key: keyof T & string })[];
  sort_state: { column: keyof T & string; direction: SortDirection };
};

export type TypedCreateTableConfigInput<T> = Omit<CreateTableConfigInput, 'layout'> & {
  layout: TypedTableLayout<T>;
};
