import { z } from 'zod';

export const versioningDataSchema = z.object({
  snoozed_update_version: z.string().nullable(),
});

export type VersioningData = z.infer<typeof versioningDataSchema>;
