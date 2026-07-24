import {
  isMentionableEntityType,
  type MentionableEntityType,
} from './entityTypes';

const ENTITY_TYPE_LABELS: Record<MentionableEntityType, string> = {
  npcs: 'NPC',
  foes: 'Foe',
  pcs: 'PC',
  factions: 'Faction',
  locations: 'Location',
  items: 'Item',
};

export const entityTypeLabel = (entityType: string): string =>
  isMentionableEntityType(entityType)
    ? ENTITY_TYPE_LABELS[entityType]
    : 'Entity';
