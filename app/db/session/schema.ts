import { z } from 'zod';
import { defineTable } from '../util';

export const sessionTable = defineTable({
  name: 'sessions',
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
        .min(1, 'Session title is required')
        .refine((val) => val.trim().length > 0, {
          message: 'Session title is required',
        }),
      updateZod: z
        .string()
        .min(1)
        .refine((val) => val.trim().length > 0, {
          message: 'Session title cannot be empty',
        }),
    },
    description: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    session_date: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    notes: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: {
        table: 'adventures',
        column: 'id',
        onDelete: 'CASCADE',
      },
      zod: z.string().min(1, 'Adventure ID is required'),
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
