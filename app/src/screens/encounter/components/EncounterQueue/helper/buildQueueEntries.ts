import type { BaseEntity } from '@db/base-entity';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { deriveCombatState, shownCombatantNames } from '@domain';

export const buildQueueEntries = (
  queueItems: EncounterQueueItem[],
  baseEntities: BaseEntity[],
) => {
  const entitiesById = new Map<string | null, BaseEntity>(
    baseEntities.map((entity) => [entity.id, entity]),
  );
  const names = shownCombatantNames(
    queueItems.map((item) => ({
      id: item.id,
      baseEntityId: item.base_entity_id,
      name: item.name,
      sequenceNumber: item.sequence_number,
    })),
    new Map(baseEntities.map((entity) => [entity.id, entity.name])),
  );
  const combatState = deriveCombatState(
    queueItems.map((item) => ({
      id: item.id,
      startingMaxHp: item.starting_max_hp,
    })),
  );

  return queueItems.flatMap((item) => {
    const name = names.get(item.id) ?? null;
    const hp = combatState.get(item.id) ?? null;
    // Stryker disable next-line ConditionalExpression,LogicalOperator,ArrayDeclaration: both maps hold one entry per queue item, so the guard is never entered and no input observes a difference
    if (name === null || hp === null) return [];

    const entity = entitiesById.get(item.base_entity_id) ?? null;
    return [{ id: item.id, name, imageId: entity?.image_id ?? null, ...hp }];
  });
};
