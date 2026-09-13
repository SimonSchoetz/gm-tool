export const BASE_ENTITY_TYPES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
] as const;

export type BaseEntityType = (typeof BASE_ENTITY_TYPES)[number];

export const isBaseEntityType = (value: string): value is BaseEntityType =>
  (BASE_ENTITY_TYPES as readonly string[]).includes(value);

export const ENTITY_TYPES = [
  ...BASE_ENTITY_TYPES,
  'sessions',
  'encounters',
  'adventures',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const isEntityType = (value: string): value is EntityType =>
  (ENTITY_TYPES as readonly string[]).includes(value);
