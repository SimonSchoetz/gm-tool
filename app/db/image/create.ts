import { invoke } from '@platform';
import { isImageFileExtension } from '@domain';
import { buildCreateQuery, generateDbTimestamps } from '../util';
import { getDatabase } from '../database';
import type { CreateImageInput } from './types';

// The caller supplies the id (generateImageId), so it can record the image before its file is written (services/imageService.ts).
export const create = async (
  { filePath }: CreateImageInput,
  id: string,
): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('filePath must be a string');
  }

  const extension = filePath.split('.').pop()?.toLowerCase() ?? null;

  if (!extension || !isImageFileExtension(extension)) {
    throw new Error(`Unsupported file extension: ${extension}`);
  }

  const originalFilename = filePath.split('/').pop() ?? null;

  const fileSize = await invoke<number>('save_image', {
    sourcePath: filePath,
    id,
    extension,
  });

  const { created_at, updated_at } = generateDbTimestamps();

  const db = await getDatabase();

  const { sql, values } = buildCreateQuery<{
    file_extension: string;
    original_filename: string | null;
    file_size: number;
    created_at: string;
    updated_at: string;
  }>('images', id, {
    file_extension: extension,
    original_filename: originalFilename,
    file_size: fileSize,
    created_at,
    updated_at,
  });
  await db.execute(sql, values);

  return id;
};
