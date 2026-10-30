import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityType } from '@domain';

export const filterByEntityTypes = (
  entities: BaseEntity[],
  selected: BaseEntityType[],
): BaseEntity[] =>
  selected.length === 0
    ? entities
    : entities.filter((entity) => selected.includes(entity.entity_type));
