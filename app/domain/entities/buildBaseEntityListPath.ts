import type { BaseEntityType } from './entityTypes';

export const buildBaseEntityListPath = (
  entityType: BaseEntityType,
  adventureId: string,
): string => `/adventure/${adventureId}/${entityType}`;
