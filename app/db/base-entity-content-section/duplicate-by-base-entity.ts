import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { getAllByBaseEntity } from './get-all-by-base-entity';

export const duplicateByBaseEntity = async (
  sourceBaseEntityId: string,
  targetBaseEntityId: string,
): Promise<void> => {
  assertValidId(sourceBaseEntityId, 'Base entity');
  assertValidId(targetBaseEntityId, 'Base entity');

  const sourceSections = await getAllByBaseEntity(sourceBaseEntityId);
  if (sourceSections.length === 0) return;

  const db = await getDatabase();

  for (const section of sourceSections) {
    // name and sort_order are copied rather than reset or re-derived from array position, so each duplicated section keeps its own label and the source's exact ordering values.
    const {
      id: _sourceRowId,
      base_entity_id: _sourceBaseEntityId,
      created_at: _sourceCreatedAt,
      updated_at: _sourceUpdatedAt,
      ...copiedColumns
    } = section;

    const { sql, values } = buildDuplicateQuery(
      'base_entity_content_sections',
      generateId(),
      copiedColumns,
      { base_entity_id: targetBaseEntityId },
    );

    await db.execute(sql, values);
  }
};
