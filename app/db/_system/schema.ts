import { z } from 'zod';

export const versioningDataSchema = z.object({
  snoozed_update_version: z.string().nullable(),
});

export type VersioningData = z.infer<typeof versioningDataSchema>;

export const deviceDataSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{64}$/),
  name: z.string().nullable(),
});

export type DeviceData = z.infer<typeof deviceDataSchema>;
