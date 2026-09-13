import { z } from 'zod';
import { BASE_ENTITY_TYPES } from '@domain';
import { defineTable } from '../util';

export const baseEntityTable = defineTable({
  name: 'base_entities',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: {
        table: 'adventures',
        column: 'id',
        onDelete: 'CASCADE',
      },
      zod: z.string(),
    },
    entity_type: {
      type: 'TEXT',
      notNull: true,
      zod: z.enum(BASE_ENTITY_TYPES),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    summary: {
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
    pinned_order: {
      type: 'INTEGER',
      zod: z.number().nullable(),
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
