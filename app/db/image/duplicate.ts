import { invoke } from '@tauri-apps/api/core';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
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

  const { created_at, updated_at } = generateDbTimestamps();

  const db = await getDatabase();

  const { sql, values } = buildCreateQuery<{
    file_extension: string;
    original_filename: string | null;
    file_size: number | null;
    frame_x: number | null;
    frame_y: number | null;
    frame_zoom: number | null;
    created_at: string;
    updated_at: string;
  }>('images', id, {
    file_extension: source.file_extension,
    original_filename: source.original_filename ?? null,
    file_size: source.file_size ?? null,
    frame_x: source.frame_x ?? null,
    frame_y: source.frame_y ?? null,
    frame_zoom: source.frame_zoom ?? null,
    created_at,
    updated_at,
  });
  await db.execute(sql, values);

  return id;
};
