import { getDatabase } from '../database';
import { settingsSchemas } from './schema';
import type { SettingsKey, SettingsValueMap } from './schema';

export const updateSetting = async <K extends SettingsKey>(
  key: K,
  value: SettingsValueMap[K],
): Promise<void> => {
  settingsSchemas[key].parse(value);
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _settings (id, value) VALUES ($1, $2)',
    [key, JSON.stringify(value)],
  );
};
