import { z } from 'zod';
import { defineTable } from '../util';

export const SESSION_VIEW_VALUES = ['prep', 'ingame'] as const;
export type SessionView = (typeof SESSION_VIEW_VALUES)[number];

export const sessionTable = defineTable({
  name: 'sessions',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    name: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    description: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    summary: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    session_date: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    active_view: {
      type: 'TEXT',
      notNull: true,
      default: "'prep'",
      zod: z.enum(SESSION_VIEW_VALUES).optional(),
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
