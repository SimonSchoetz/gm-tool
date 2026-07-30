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
