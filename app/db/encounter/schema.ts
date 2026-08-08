import { z } from 'zod';
import { defineTable } from '../util';

export const encounterTable = defineTable({
  name: 'encounters',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'adventures', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    name: { type: 'TEXT', zod: z.string().nullable() },
    description: { type: 'TEXT', zod: z.string().nullable() },
    pinned_order: { type: 'INTEGER', zod: z.number().nullable() },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
