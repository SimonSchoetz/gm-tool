import { z } from 'zod';

export const syncChangeRecordSchema = z.object({
  table_name: z.string(),
  row_id: z.string(),
  seq: z.number(),
  deleted: z.number(),
  deleted_at: z.string().nullable(),
});

export type SyncChangeRecord = z.infer<typeof syncChangeRecordSchema>;
