import type { BaseEntity } from '@db/base-entity';

export const sortEntitiesByName = (entities: BaseEntity[]): BaseEntity[] =>
  [...entities].sort((a, b) => {
    if (a.name === null) return b.name === null ? 0 : 1;
    if (b.name === null) return -1;
    return a.name.localeCompare(b.name);
  });
