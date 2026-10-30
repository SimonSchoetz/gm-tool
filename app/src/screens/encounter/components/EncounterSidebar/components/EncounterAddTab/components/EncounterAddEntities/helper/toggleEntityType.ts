import type { BaseEntityType } from '@domain';

export const toggleEntityType = (
  selected: BaseEntityType[],
  entityType: BaseEntityType,
): BaseEntityType[] =>
  selected.includes(entityType)
    ? selected.filter((type) => type !== entityType)
    : [...selected, entityType];
