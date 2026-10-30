import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { getAllByEncounter } from './get-all-by-encounter';

export const duplicateByEncounter = async (
  sourceEncounterId: string,
  targetEncounterId: string,
  startingMaxHpById: ReadonlyMap<string, number | null>,
): Promise<void> => {
  assertValidId(sourceEncounterId, 'Encounter');
  assertValidId(targetEncounterId, 'Encounter');

  const sourceItems = await getAllByEncounter(sourceEncounterId);
  const db = await getDatabase();

  for (const item of sourceItems) {
    if (!startingMaxHpById.has(item.id)) continue;
    const startingMaxHp = startingMaxHpById.get(item.id) ?? null;

    // starting_max_hp is re-supplied from the map: the caller derives each item's full-HP maximum from the source's log, so the stored value is not copied.
    const {
      id: _sourceRowId,
      encounter_id: _sourceEncounterId,
      starting_max_hp: _sourceStartingMaxHp,
      created_at: _sourceCreatedAt,
      updated_at: _sourceUpdatedAt,
      ...copiedColumns
    } = item;

    const { sql, values } = buildDuplicateQuery(
      'encounter_queue_items',
      generateId(),
      copiedColumns,
      { encounter_id: targetEncounterId, starting_max_hp: startingMaxHp },
    );

    await db.execute(sql, values);
  }
};
