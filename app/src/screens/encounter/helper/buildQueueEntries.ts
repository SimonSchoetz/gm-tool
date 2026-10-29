import type { BaseEntity } from '@db/base-entity';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { deriveCombatState, shownCombatantNames } from '@domain';

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
  );
  const keptItems = queueItems.filter(
    (item) => !combatState.get(item.id)?.removed,
  );
  // Naming sees every kept item, hidden defeated ones included, so toggling Hide defeated never renumbers siblings.
  const names = shownCombatantNames(
    keptItems.map((item) => ({
      id: item.id,
      baseEntityId: item.base_entity_id,
      name: item.name,
      sequenceNumber: item.sequence_number,
    })),
    new Map(baseEntities.map((entity) => [entity.id, entity.name])),
  );

  return keptItems.flatMap((item) => {
    const name = names.get(item.id) ?? null;
    const state = combatState.get(item.id) ?? null;
    // Stryker disable next-line ConditionalExpression,LogicalOperator,ArrayDeclaration: both maps hold one entry per kept item, so the guard is never entered and no input observes a difference
    if (name === null || state === null) return [];
    if (hideDefeated && state.defeated) return [];

    const entity = entitiesById.get(item.base_entity_id) ?? null;
    return [
      {
        id: item.id,
        name,
        imageId: entity?.image_id ?? null,
        maxHp: state.maxHp,
        currentHp: state.currentHp,
        tempHp: state.tempHp,
        defeated: state.defeated,
      },
    ];
  });
};
