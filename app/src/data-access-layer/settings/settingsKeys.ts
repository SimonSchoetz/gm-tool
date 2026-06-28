import type { SettingsKey } from '@db/settings';

export const settingsKeys = {
  setting: (key: SettingsKey) => ['settings', key] as const,
};
