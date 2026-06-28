import { z } from 'zod';

export const settingsSchemas = {
  background: z.object({ animation_enabled: z.boolean() }),
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type SettingsValueMap = {
  [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]>;
};

export type BackgroundSettings = SettingsValueMap['background'];
