import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- read by no parser: only its inferred type SyncChangeRecord is consumed, and db/_sync/get-changes-since.ts types the selected rows with it unvalidated
const syncChangeRecordSchema = z.object({
  table_name: z.string(),
  row_id: z.string(),
  seq: z.number(),
  deleted: z.number(),
  deleted_at: z.string().nullable(),
});

export type SyncChangeRecord = z.infer<typeof syncChangeRecordSchema>;
