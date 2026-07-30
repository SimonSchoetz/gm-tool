import { invoke } from '@tauri-apps/api/core';
import { generateId, buildDuplicateQuery, assertValidId } from '../util';
import { getDatabase } from '../database';
import { get } from './get';

export const duplicate = async (sourceId: string): Promise<string> => {
  assertValidId(sourceId, 'image');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Image not found: ${sourceId}`);
  }

  const id = generateId();

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
