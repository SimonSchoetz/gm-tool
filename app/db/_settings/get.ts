import { getDatabase } from '../database';
import { settingsSchemas } from './schema';
import type { SettingsKey, SettingsValueMap } from './schema';

export const getSetting = async <K extends SettingsKey>(
  key: K,
): Promise<SettingsValueMap[K] | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM _settings WHERE id = $1',
    [key],
  );
  if (rows.length === 0) return null;
  const raw = rows[0].value;
  return settingsSchemas[key].parse(JSON.parse(raw)) as SettingsValueMap[K];
};
