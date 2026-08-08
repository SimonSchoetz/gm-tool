import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { get } from './get';

export const duplicate = async (sourceId: string): Promise<string> => {
  assertValidId(sourceId, 'Encounter');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Encounter not found: ${sourceId}`);
  }

  const id = generateId();

  const {
    id: _sourceRowId,
    name: _sourceName,
    pinned_order: _sourcePinnedOrder,
    created_at: _sourceCreatedAt,
    updated_at: _sourceUpdatedAt,
    ...copiedColumns
  } = source;

  const { sql, values } = buildDuplicateQuery(
    'encounters',
    id,
    copiedColumns,
    {},
  );

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
