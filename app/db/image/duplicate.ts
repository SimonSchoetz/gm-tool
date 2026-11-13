import { invoke } from '@platform';
import { buildDuplicateQuery, assertValidId } from '../util';
import { getDatabase } from '../database';
import { get } from './get';

// The caller supplies the copy's id (generateImageId), so it can record the copy before its file is written (services/imageService.ts).
export const duplicate = async (
  sourceId: string,
  id: string,
): Promise<string> => {
  assertValidId(sourceId, 'image');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Image not found: ${sourceId}`);
  }

  const dataBase64 = await invoke<string>('read_image_bytes', {
    id: sourceId,
    extension: source.file_extension,
  });
  await invoke('save_image_bytes', {
    id,
    extension: source.file_extension,
    dataBase64,
  });

  const {
    id: _sourceRowId,
    created_at: _sourceCreatedAt,
    updated_at: _sourceUpdatedAt,
    ...copiedColumns
  } = source;

  const { sql, values } = buildDuplicateQuery('images', id, copiedColumns, {});

  const db = await getDatabase();
  await db.execute(sql, values);

  return id;
};
