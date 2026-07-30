import { isEntityType, type EntityType } from './entityTypes';
import { entityTypeError } from './errors';

const ENTITY_SEGMENT: Record<EntityType, string> = {
  npcs: 'npc',
  foes: 'foe',
  pcs: 'pc',
  factions: 'faction',
  locations: 'location',
  items: 'item',
  sessions: 'session',
  adventures: 'adventure',
};

export const buildEntityPath = (
  entityType: string,
  entityId: string,
  adventureId: string | null,
): string => {
  if (!isEntityType(entityType)) {
    throw entityTypeError(entityType);
  }
  const segment = ENTITY_SEGMENT[entityType];
  return adventureId
    ? `/adventure/${adventureId}/${segment}/${entityId}`
    : `/${segment}/${entityId}`;
};
