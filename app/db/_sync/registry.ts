import { z } from 'zod';
import { imageTable } from '../image';
import { adventureTable } from '../adventure';
import { sessionTable } from '../session';
import { baseEntityTable } from '../base-entity';
import { baseEntityContentSectionTable } from '../base-entity-content-section';
import { encounterTable } from '../encounter';
import { sessionStepTable } from '../session-step';
import { tableConfigTable } from '../table-config';

type SyncedTable = {
  name: string;
  columns: string[];
  zodSchema: z.ZodObject;
};

const syncedTable = (
  name: string,
  table: { zodSchema: z.ZodObject },
): SyncedTable => ({
  name,
  columns: Object.keys(table.zodSchema.shape),
  zodSchema: table.zodSchema,
});

// FK dependency order: parents before children. Apply upserts in this order, deletes in reverse. images first (SET NULL targets), adventures before all adventure-scoped tables, session_steps after sessions, base_entity_content_sections after base_entities, table_config last (no FK relations).
export const SYNCED_TABLES: SyncedTable[] = [
  syncedTable('images', imageTable),
  syncedTable('adventures', adventureTable),
  syncedTable('sessions', sessionTable),
  syncedTable('base_entities', baseEntityTable),
  syncedTable('base_entity_content_sections', baseEntityContentSectionTable),
  syncedTable('encounters', encounterTable),
  syncedTable('session_steps', sessionStepTable),
  syncedTable('table_config', tableConfigTable),
];

export const SYNCED_TABLE_NAMES = SYNCED_TABLES.map((t) => t.name);
