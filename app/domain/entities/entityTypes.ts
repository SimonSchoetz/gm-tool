export const ENTITY_TYPES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
  'sessions',
  'adventures',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const isEntityType = (value: string): value is EntityType =>
  (ENTITY_TYPES as readonly string[]).includes(value);
