import type { SettingsKey } from '@db/_settings';

export const settingsKeys = {
  setting: (key: SettingsKey) => ['settings', key] as const,
};
