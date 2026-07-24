export const MENTIONABLE_ENTITY_TYPES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
] as const;

export type MentionableEntityType = (typeof MENTIONABLE_ENTITY_TYPES)[number];

export const isMentionableEntityType = (
  value: string,
): value is MentionableEntityType =>
  (MENTIONABLE_ENTITY_TYPES as readonly string[]).includes(value);
