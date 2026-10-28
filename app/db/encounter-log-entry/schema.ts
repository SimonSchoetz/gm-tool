import { z } from 'zod';
import { defineTable } from '../util';

export const encounterLogEntryTable = defineTable({
  name: 'encounter_log_entries',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    encounter_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'encounters', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    kind: { type: 'TEXT', notNull: true, zod: z.string() },
    payload: { type: 'TEXT', notNull: true, zod: z.string() },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
