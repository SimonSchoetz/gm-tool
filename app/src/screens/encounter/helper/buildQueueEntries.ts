import type { BaseEntity } from '@db/base-entity';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { deriveCombatState } from '@domain';
import { nameQueueItems } from './nameQueueItems';

export const buildQueueEntries = (
  queueItems: EncounterQueueItem[],
  logEntries: EncounterLogEntry[],
  baseEntities: BaseEntity[],
  hideDefeated: boolean,
) => {
  const entitiesById = new Map<string | null, BaseEntity>(
    baseEntities.map((entity) => [entity.id, entity]),
  );
  const combatState = deriveCombatState(
    queueItems.map((item) => ({
      id: item.id,
      startingMaxHp: item.starting_max_hp,
    })),
    logEntries,
  ).items;
  const keptItems = queueItems.filter((item) => {
    const state = combatState.get(item.id) ?? null;
    // Stryker disable next-line ConditionalExpression,BooleanLiteral: deriveCombatState holds one state per item, so the guard is never entered and no input observes a difference
    if (state === null) return false;
    return !state.removed;
  });
  const names = nameQueueItems(queueItems, combatState, baseEntities);

  return keptItems.flatMap((item) => {
    const itemNames = names.get(item.id) ?? null;
    const state = combatState.get(item.id) ?? null;
    // Stryker disable next-line ConditionalExpression,LogicalOperator,ArrayDeclaration: both maps hold one entry per kept item, so the guard is never entered and no input observes a difference
    if (itemNames === null || state === null) return [];
    if (hideDefeated && state.defeated) return [];

    const entity = entitiesById.get(item.base_entity_id) ?? null;
    return [
      {
        id: item.id,
        name: itemNames.shownName,
        automaticName: itemNames.automaticName,
        entity:
          entity === null
            ? null
            : { id: entity.id, entityType: entity.entity_type },
        imageId: entity?.image_id ?? null,
        maxHp: state.maxHp,
        currentHp: state.currentHp,
        tempHp: state.tempHp,
        defeated: state.defeated,
      },
    ];
  });
};
