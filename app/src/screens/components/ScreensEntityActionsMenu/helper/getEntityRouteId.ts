import type { EntityType } from '@domain';

type RouteParams = Readonly<Record<string, string | undefined>>;

export const getEntityRouteId = (
  entityType: EntityType,
  params: RouteParams,
): string => {
  switch (entityType) {
    case 'adventures':
      return params.adventureId ?? '';
    case 'sessions':
      return params.sessionId ?? '';
    case 'encounters':
      return params.encounterId ?? '';
    case 'npcs':
    case 'pcs':
    case 'foes':
    case 'factions':
    case 'locations':
    case 'items':
      return params.baseEntityId ?? '';
  }
};
