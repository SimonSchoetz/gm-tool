import { isEntityType, type EntityType } from './entityTypes';

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  npcs: 'NPC',
  foes: 'Foe',
  pcs: 'PC',
  factions: 'Faction',
  locations: 'Location',
  items: 'Item',
  sessions: 'Session',
  encounters: 'Encounter',
  adventures: 'Adventure',
};

export const entityTypeLabel = (entityType: string): string =>
  isEntityType(entityType) ? ENTITY_TYPE_LABELS[entityType] : 'Entity';
