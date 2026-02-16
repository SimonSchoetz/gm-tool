import { z } from 'zod';
import { defineTable } from '../util';

export const tableConfigTable = defineTable({
  name: 'table_config',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    table_name: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    display_name: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    color: {
      type: 'TEXT',
      notNull: true,
      zod: z.string(),
    },
    tagging_enabled: {
      type: 'INTEGER',
      notNull: true,
      default: '1',
      zod: z.number(),
      updateZod: z.number().min(0).max(1),
    },
    scope: {
      type: 'TEXT',
      notNull: true,
      default: "'adventure'",
      zod: z.enum(['adventure', 'global']),
    },
    searchable_columns: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    created_at: {
      type: 'TEXT',
      default: 'CURRENT_TIMESTAMP',
      zod: z.string().optional(),
    },
    updated_at: {
      type: 'TEXT',
      default: 'CURRENT_TIMESTAMP',
      zod: z.string().optional(),
    },
  },
});
