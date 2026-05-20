import { z } from 'zod';
import { defineTable } from '../util';

export const locationTable = defineTable({
  name: 'locations',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'adventures', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    name: { type: 'TEXT', zod: z.string().optional() },
    summary: { type: 'TEXT', zod: z.string().optional() },
    description: { type: 'TEXT', zod: z.string().optional() },
    image_id: {
      type: 'TEXT',
      foreignKey: { table: 'images', column: 'id', onDelete: 'SET NULL' },
      zod: z.string().nullable().optional(),
    },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
