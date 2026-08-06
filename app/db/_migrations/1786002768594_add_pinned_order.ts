import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
  await db.execute('ALTER TABLE npcs ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE pcs ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE foes ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE factions ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE locations ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE items ADD COLUMN pinned_order INTEGER');
  await db.execute('ALTER TABLE sessions ADD COLUMN pinned_order INTEGER');
};

export const addPinnedOrderMigration = {
  id: '1786002768594',
  up,
};
