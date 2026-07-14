import { z } from 'zod';
import { ENDPOINT_ID_HEX_REGEX } from '@domain';

export const versioningDataSchema = z.object({
  snoozed_update_version: z.string().nullable(),
});

export type VersioningData = z.infer<typeof versioningDataSchema>;

export const deviceDataSchema = z.object({
  id: z.string().regex(ENDPOINT_ID_HEX_REGEX),
  name: z.string().nullable(),
});

export type DeviceData = z.infer<typeof deviceDataSchema>;
