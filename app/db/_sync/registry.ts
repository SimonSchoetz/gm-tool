import { imageTable } from '../image/schema';
import { adventureTable } from '../adventure/schema';
import { sessionTable } from '../session/schema';
import { npcTable } from '../npc/schema';
import { pcTable } from '../pc/schema';
import { foeTable } from '../foe/schema';
import { factionTable } from '../faction/schema';
import { locationTable } from '../location/schema';
import { itemTable } from '../item/schema';
import { sessionStepTable } from '../session-step/schema';
import { tableConfigTable } from '../table-config/schema';

type SyncedTable = {
  name: string;
  columns: string[];
};

// FK dependency order: parents before children. Apply upserts in this order,
// deletes in reverse. images first (SET NULL targets), adventures before all
// adventure-scoped tables, session_steps after sessions, table_config last
// (no FK relations).
export const SYNCED_TABLES: SyncedTable[] = [
  { name: 'images', columns: Object.keys(imageTable.zodSchema.shape) },
  { name: 'adventures', columns: Object.keys(adventureTable.zodSchema.shape) },
  { name: 'sessions', columns: Object.keys(sessionTable.zodSchema.shape) },
  { name: 'npcs', columns: Object.keys(npcTable.zodSchema.shape) },
  { name: 'pcs', columns: Object.keys(pcTable.zodSchema.shape) },
  { name: 'foes', columns: Object.keys(foeTable.zodSchema.shape) },
  { name: 'factions', columns: Object.keys(factionTable.zodSchema.shape) },
  { name: 'locations', columns: Object.keys(locationTable.zodSchema.shape) },
  { name: 'items', columns: Object.keys(itemTable.zodSchema.shape) },
  {
    name: 'session_steps',
    columns: Object.keys(sessionStepTable.zodSchema.shape),
  },
  {
    name: 'table_config',
    columns: Object.keys(tableConfigTable.zodSchema.shape),
  },
];

export const SYNCED_TABLE_NAMES = SYNCED_TABLES.map((t) => t.name);
