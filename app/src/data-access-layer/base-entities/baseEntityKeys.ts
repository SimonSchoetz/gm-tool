import type { BaseEntityType } from '@domain/entities';

export const baseEntityKeys = {
  // Must start with the bare entity type: useSetPinnedOrder invalidates [table_config.table_name] as a prefix. A future edit prefixing this key would silently stop pin/unpin from refreshing lists.
  list: (entityType: BaseEntityType, adventureId: string) =>
    [entityType, adventureId] as const,
  detail: (entityType: BaseEntityType, baseEntityId: string) =>
    ['base-entity', entityType, baseEntityId] as const,
};
