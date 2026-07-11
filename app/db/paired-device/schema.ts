import { z } from 'zod';
import { defineTable } from '../util';

export const pairedDeviceTable = defineTable({
  name: 'paired_devices',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string().regex(/^[0-9a-f]{64}$/),
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
