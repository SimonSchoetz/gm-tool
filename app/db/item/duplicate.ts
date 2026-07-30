import { getDatabase } from '../database';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { get } from './get';

export const duplicate = async (
  sourceId: string,
  imageId: string | null,
): Promise<string> => {
  assertValidId(sourceId, 'Item');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Item not found: ${sourceId}`);
  }

  const id = generateId();

  // The copied column set is derived by exclusion rather than listed, so a column added to items later is duplicated without touching this file. image_id is excluded because the caller supplies a freshly duplicated image; name is excluded so the column takes SQL NULL.
  const {
    id: _sourceRowId,
    name: _sourceName,
    image_id: _sourceImageId,
    created_at: _sourceCreatedAt,
    updated_at: _sourceUpdatedAt,
    ...copiedColumns
  } = source;

  const { sql, values } = buildDuplicateQuery('items', id, copiedColumns, {
    image_id: imageId,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
