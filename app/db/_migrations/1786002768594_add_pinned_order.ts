import type Database from '@tauri-apps/plugin-sql';
import { ensureColumn } from '../util';

const PINNED_ORDER_TABLES = [
  'npcs',
  'pcs',
  'foes',
  'factions',
  'locations',
  'items',
  'sessions',
];

const up = async (db: Database): Promise<void> => {
  for (const table of PINNED_ORDER_TABLES) {
    await ensureColumn(
      db,
      table,
      'pinned_order',
      `ALTER TABLE ${table} ADD COLUMN pinned_order INTEGER`,
    );
  }
};

export const addPinnedOrderMigration = {
  id: '1786002768594',
  up,
};
