import type { BaseEntity } from '@db/base-entity';

type NamedBaseEntity = BaseEntity & { name: string };

const hasName = (entity: BaseEntity): entity is NamedBaseEntity =>
  entity.name !== null;

export const sortEntitiesByName = (entities: BaseEntity[]): BaseEntity[] => [
  ...entities.filter(hasName).sort((a, b) => a.name.localeCompare(b.name)),
  ...entities.filter((entity) => !hasName(entity)),
];
