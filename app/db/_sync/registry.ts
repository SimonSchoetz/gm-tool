import { z } from 'zod';
import { imageTable } from '../image/schema';
import { adventureTable } from '../adventure/schema';
import { sessionTable } from '../session/schema';
import { npcTable } from '../npc/schema';
import { pcTable } from '../pc/schema';
import { foeTable } from '../foe/schema';
import { factionTable } from '../faction/schema';
import { locationTable } from '../location/schema';
import { itemTable } from '../item/schema';
import { encounterTable } from '../encounter/schema';
import { sessionStepTable } from '../session-step/schema';
import { tableConfigTable } from '../table-config/schema';

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

// FK dependency order: parents before children. Apply upserts in this order, deletes in reverse. images first (SET NULL targets), adventures before all adventure-scoped tables, session_steps after sessions, table_config last (no FK relations).
export const SYNCED_TABLES: SyncedTable[] = [
  syncedTable('images', imageTable),
  syncedTable('adventures', adventureTable),
  syncedTable('sessions', sessionTable),
  syncedTable('npcs', npcTable),
  syncedTable('pcs', pcTable),
  syncedTable('foes', foeTable),
  syncedTable('factions', factionTable),
  syncedTable('locations', locationTable),
  syncedTable('items', itemTable),
  syncedTable('encounters', encounterTable),
  syncedTable('session_steps', sessionStepTable),
  syncedTable('table_config', tableConfigTable),
];

export const SYNCED_TABLE_NAMES = SYNCED_TABLES.map((t) => t.name);
