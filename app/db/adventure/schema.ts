import { z } from 'zod';
import { defineTable } from '../util';

export const adventureTable = defineTable({
  name: 'adventures',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    description: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    image_id: {
      type: 'TEXT',
      foreignKey: {
        table: 'images',
        column: 'id',
        onDelete: 'SET NULL',
      },
      zod: z.string().nullable(),
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
