import { z } from 'zod';
import { ENDPOINT_ID_HEX_REGEX } from '@domain';
import { defineTable } from '../util';

export const pairedDeviceTable = defineTable({
  name: 'paired_devices',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string().regex(ENDPOINT_ID_HEX_REGEX),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable().optional(),
    },
    created_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    updated_at: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
  },
});
