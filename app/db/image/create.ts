import { invoke } from '@tauri-apps/api/core';
import { generateId, buildCreateQuery } from '../util';
import { getDatabase } from '../database';
import { CreateImageInput } from './types';

export const create = async ({
  filePath,
}: CreateImageInput): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('filePath must be a string');
  }

  const extension = filePath.split('.').pop()?.toLowerCase();

  if (
    !extension ||
    !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)
  ) {
    throw new Error(`Unsupported file extension: ${extension}`);
  }

  const originalFilename = filePath.split('/').pop() ?? null;

  const id = generateId();

  const fileSize = await invoke<number>('save_image', {
    sourcePath: filePath,
    id,
    extension,
  });

  const db = await getDatabase();
  const { sql, values } = buildCreateQuery('images', id, {
    file_extension: extension,
    original_filename: originalFilename,
    file_size: fileSize,
  });
  await db.execute(sql, values);

  return id;
};
