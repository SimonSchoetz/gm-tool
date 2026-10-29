import type { TableLayout } from '../../layout-schema';

export const TABLE_CONFIG_ID = 'custom-config';

export const TABLE_CONFIG_TIMESTAMP = '2026-01-10T09:00:00.000Z';

export const insertTableConfig = async (layout: TableLayout): Promise<void> => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  await db.execute(
    "INSERT INTO table_config (id, table_name, color, tagging_enabled, scope, layout, created_at, updated_at) VALUES ($1, 'custom', '1, 2, 3', 1, 'global', $2, $3, $3)",
    [TABLE_CONFIG_ID, JSON.stringify(layout), TABLE_CONFIG_TIMESTAMP],
  );
};
