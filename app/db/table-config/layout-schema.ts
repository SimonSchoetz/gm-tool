import { z } from 'zod';

export const layoutColumnSchema = z.object({
  key: z.string(),
  label: z.string(),
  sortable: z.boolean().optional(),
  resizable: z.boolean().optional(),
  width: z.number(),
});

const persistedSortStateSchema = z.object({
  column: z.string(),
  direction: z.enum(['asc', 'desc']),
});

export const tableLayoutSchema = z.object({
  searchable_columns: z.array(z.string()),
  columns: z.array(layoutColumnSchema),
  sort_state: persistedSortStateSchema,
});

export type LayoutColumn = z.infer<typeof layoutColumnSchema>;
export type TableLayout = z.infer<typeof tableLayoutSchema>;
export type PersistedSortState = z.infer<typeof persistedSortStateSchema>;
export type SortDirection = 'asc' | 'desc';
