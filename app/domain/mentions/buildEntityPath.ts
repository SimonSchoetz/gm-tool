const ENTITY_SEGMENT: Record<string, string> = {
  npcs: 'npc',
  sessions: 'session',
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
  const segment = ENTITY_SEGMENT[entityType];
  if (!segment) {
    throw new Error(`buildEntityPath: unknown entityType "${entityType}"`);
  }
  return adventureId
    ? `/adventure/${adventureId}/${segment}/${entityId}`
    : `/${segment}/${entityId}`;
};
