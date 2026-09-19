import { z } from 'zod';
import { LAZY_DM_STEP_KEYS } from '@domain';
import { defineTable } from '../util';

export const sessionStepTable = defineTable({
  name: 'session_steps',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    session_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: {
        table: 'sessions',
        column: 'id',
        onDelete: 'CASCADE',
      },
      zod: z.string(),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    content: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    default_step_key: {
      type: 'TEXT',
      zod: z.enum(LAZY_DM_STEP_KEYS).nullable(),
    },
    checked: {
      type: 'INTEGER',
      notNull: true,
      default: '0',
      zod: z.number(),
    },
    sort_order: {
      type: 'INTEGER',
      notNull: true,
      zod: z.number(),
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
