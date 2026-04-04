import { z } from 'zod';
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
      zod: z.string().optional(),
    },
    content: {
      type: 'TEXT',
      zod: z.string().optional(),
    },
    default_step_key: {
      type: 'TEXT',
      zod: z.enum([
        'review_characters',
        'strong_start',
        'potential_scenes',
        'secrets_clues',
        'fantastic_locations',
        'important_npcs',
        'relevant_monsters',
        'magic_items',
      ]).nullable().optional(),
    },
    checked: {
      type: 'INTEGER',
      notNull: true,
      default: '0',
      zod: z.number().optional(),
    },
    sort_order: {
      type: 'INTEGER',
      notNull: true,
      zod: z.number(),
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
