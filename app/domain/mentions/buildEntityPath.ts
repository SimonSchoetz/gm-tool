import {
  isMentionableEntityType,
  type MentionableEntityType,
} from './entityTypes';
import { mentionEntityTypeError } from './errors';

const ENTITY_SEGMENT: Record<MentionableEntityType, string> = {
  npcs: 'npc',
  foes: 'foe',
  pcs: 'pc',
  factions: 'faction',
  locations: 'location',
  items: 'item',
};

export const buildEntityPath = (
  entityType: string,
  entityId: string,
  adventureId: string | null,
): string => {
  if (!isMentionableEntityType(entityType)) {
    throw mentionEntityTypeError(entityType);
  }
  const segment = ENTITY_SEGMENT[entityType];
  return adventureId
    ? `/adventure/${adventureId}/${segment}/${entityId}`
    : `/${segment}/${entityId}`;
};
