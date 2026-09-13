import type { BaseEntityType } from './entityTypes';

const BASE_ENTITY_SEARCH_HINTS: Record<BaseEntityType, string> = {
  npcs: 'profession',
  foes: 'type',
  pcs: 'faction',
  factions: 'leader',
  locations: 'region',
  items: 'type',
};

export const baseEntitySearchHint = (entityType: BaseEntityType): string =>
  BASE_ENTITY_SEARCH_HINTS[entityType];
