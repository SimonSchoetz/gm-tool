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
    title: {
      type: 'TEXT',
      notNull: true,
      zod: z
        .string()
        .min(1, 'Adventure title is required')
        .refine((val) => val.trim().length > 0, {
          message: 'Adventure title is required',
        }),
      updateZod: z
        .string()
        .min(1)
        .refine((val) => val.trim().length > 0, {
          message: 'Adventure title cannot be empty',
        }),
    },
    description: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    image_id: {
      type: 'TEXT',
      foreignKey: {
        table: 'images',
        column: 'id',
        onDelete: 'SET NULL',
      },
      zod: z.string().nullable().optional(),
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
