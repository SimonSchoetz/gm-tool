import { z } from 'zod';
import { BASE_ENTITY_TYPES } from '@domain';

const SETTINGS_SCHEMAS = {
  background: z.object({ animation_enabled: z.boolean() }),
  encounterAddFilter: z.object({
    entity_types: z.array(z.enum(BASE_ENTITY_TYPES)),
  }),
} as const;

export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;
export type SettingsValueMap = {
  [K in SettingsKey]: z.infer<(typeof SETTINGS_SCHEMAS)[K]>;
};

// Typed per key: a lookup by a generic key then parses to that key's own value type, where the union of every key's schema would parse to the union of their values.
export const settingsSchemas: {
  [K in SettingsKey]: z.ZodType<SettingsValueMap[K]>;
} = SETTINGS_SCHEMAS;

export type BackgroundSettings = SettingsValueMap['background'];
