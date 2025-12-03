import { invoke } from '@tauri-apps/api/core';
import { generateId } from '../../util';
import { getDatabase } from '../database';
import { CreateImageInput } from './types';

export const create = async ({
  filePath,
}: CreateImageInput): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('filePath must be a string');
  }

  const extension = filePath.split('.').pop()?.toLowerCase() as
    | 'jpg'
    | 'jpeg'
    | 'png'
    | 'webp'
    | 'gif';

  if (!extension || !['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    throw new Error(`Unsupported file extension: ${extension}`);
  }

  const originalFilename = filePath.split('/').pop() || undefined;

  const id = generateId();

  // Save the image file to app data directory and get file size
  const fileSize = await invoke<number>('save_image', {
    sourcePath: filePath,
    id,
    extension,
  });

  // Create database record
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
    [id, extension, originalFilename ?? null, fileSize]
  );

  return id;
};
