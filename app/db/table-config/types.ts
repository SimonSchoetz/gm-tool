import z from 'zod';
import { tableConfigTable } from './schema';
import type { TableLayout } from './layout-schema';

export type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

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
