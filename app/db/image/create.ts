import { generateId } from '../../util';
import { getDatabase } from '../database';
import { CreateImageInput } from './types';

export const create = async ({
  filePath,
}: CreateImageInput): Promise<string> => {
  if (typeof filePath !== 'string') {
    throw new Error('filePath must be a string');
  }

  // TODO: Call Rust command to save image file

  const extension = filePath.split('.').pop()?.toLowerCase() as
    | 'jpg'
    | 'jpeg'
    | 'png'
    | 'webp'
    | 'gif';

  const originalFilename = filePath.split('/').pop() || undefined;
  const fileSize = undefined; // TODO: Get actual file size

  const id = generateId();
  const db = await getDatabase();

  await db.execute(
    'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
    [id, extension, originalFilename ?? null, fileSize ?? null]
  );

  return id;
};
