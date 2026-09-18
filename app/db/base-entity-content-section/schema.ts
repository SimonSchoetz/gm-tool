import { z } from 'zod';
import { BASE_ENTITY_CONTENT_SECTION_TYPES } from '@domain';
import { defineTable } from '../util';

export const baseEntityContentSectionTable = defineTable({
  name: 'base_entity_content_sections',
  columns: {
    id: {
      type: 'TEXT',
      primaryKey: true,
      zod: z.string(),
    },
    base_entity_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: {
        table: 'base_entities',
        column: 'id',
        onDelete: 'CASCADE',
      },
      zod: z.string(),
    },
    name: {
      type: 'TEXT',
      zod: z.string().nullable(),
    },
    type: {
      type: 'TEXT',
      notNull: true,
      zod: z.enum(BASE_ENTITY_CONTENT_SECTION_TYPES),
    },
    content: {
      type: 'TEXT',
      zod: z.string().nullable(),
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
