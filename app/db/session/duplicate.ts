import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { get } from './get';

export const duplicate = async (sourceId: string): Promise<string> => {
  assertValidId(sourceId, 'session');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Session not found: ${sourceId}`);
  }

  const id = generateId();

  // The copied column set is derived by exclusion rather than listed, so a column added to sessions later is duplicated without touching this file. name is excluded so the column takes SQL NULL. active_view is copied, not omitted, so the duplicate opens in the view the source was left in.
  const {
    id: _sourceRowId,
    name: _sourceName,
    created_at: _sourceCreatedAt,
    updated_at: _sourceUpdatedAt,
    ...copiedColumns
  } = source;

  const { sql, values } = buildDuplicateQuery(
    'sessions',
    id,
    copiedColumns,
    {},
  );

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
