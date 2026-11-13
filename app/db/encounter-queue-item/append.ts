import { getDatabase } from '../database';
import { generateId, generateDbTimestamps, assertValidId } from '../util';
import type { AppendEncounterQueueItemInput } from './types';

// One INSERT that reads the next position and sequence number itself, so two adds cannot both read the same highest value. The item goes after the encounter's last one. A combatant is numbered one past the highest sequence number among the combatants sharing its numbering key: an entity combatant's key is its base entity; a random combatant's is its name among the combatants without a base entity, which includes a combatant whose entity was deleted, as shownCombatantNames keys it.
export const append = async (
  item: AppendEncounterQueueItemInput,
): Promise<string> => {
  assertValidId(item.encounter_id, 'Encounter');
  if ('base_entity_id' in item) {
    assertValidId(item.base_entity_id, 'Base entity');
  }

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const columns: string[] = [];
  const values: unknown[] = [];
  const bind = (column: string, value: unknown) => {
    columns.push(column);
    values.push(value);
    return `$${values.length}`;
  };

  const selects = [
    bind('id', id),
    bind('encounter_id', item.encounter_id),
    bind('kind', item.kind),
  ];
  const encounterPlaceholder = '$2';

  let sequenceScope: string | null = null;
  if ('base_entity_id' in item) {
    const baseEntityPlaceholder = bind('base_entity_id', item.base_entity_id);
    selects.push(baseEntityPlaceholder);
    sequenceScope = `base_entity_id = ${baseEntityPlaceholder}`;
  }
  if (item.name !== undefined) {
    const namePlaceholder = bind('name', item.name);
    selects.push(namePlaceholder);
    if (item.kind === 'combatant' && !('base_entity_id' in item)) {
      sequenceScope = `kind = 'combatant' AND base_entity_id IS NULL AND name = ${namePlaceholder}`;
    }
  }
  if (item.kind === 'combatant' && item.starting_max_hp !== undefined) {
    selects.push(bind('starting_max_hp', item.starting_max_hp));
  }
  selects.push(bind('created_at', created_at), bind('updated_at', updated_at));

  if (sequenceScope !== null) {
    columns.push('sequence_number');
    selects.push(
      `(SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM encounter_queue_items WHERE encounter_id = ${encounterPlaceholder} AND ${sequenceScope})`,
    );
  }
  columns.push('sort_order');
  selects.push('COALESCE(MAX(sort_order), -1) + 1');

  // Every column name is a literal of this file.
  const sql = `INSERT INTO encounter_queue_items (${columns.join(', ')}) SELECT ${selects.join(', ')} FROM encounter_queue_items WHERE encounter_id = ${encounterPlaceholder}`;

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
