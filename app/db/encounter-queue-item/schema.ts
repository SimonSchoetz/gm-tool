import { z } from 'zod';
import { defineTable } from '../util';

export const encounterQueueItemTable = defineTable({
  name: 'encounter_queue_items',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    encounter_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'encounters', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    kind: {
      type: 'TEXT',
      notNull: true,
      zod: z.enum(['combatant', 'event']),
    },
    base_entity_id: {
      type: 'TEXT',
      foreignKey: {
        table: 'base_entities',
        column: 'id',
        onDelete: 'SET NULL',
      },
      zod: z.string().nullable(),
    },
    name: { type: 'TEXT', zod: z.string().nullable() },
    custom_name: { type: 'TEXT', zod: z.string().nullable() },
    notes: { type: 'TEXT', zod: z.string().nullable() },
    sequence_number: { type: 'INTEGER', zod: z.number().nullable() },
    starting_max_hp: { type: 'INTEGER', zod: z.number().nullable() },
    sort_order: { type: 'INTEGER', notNull: true, zod: z.number() },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
