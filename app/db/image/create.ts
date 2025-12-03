import { generateId } from '../../util';
import { getDatabase } from '../database';
import { imageTable } from './schema';
import type { CreateImageInput } from './types';

export const create = async (data: CreateImageInput): Promise<string> => {
  const validated = imageTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();

  await db.execute(
    'INSERT INTO images (id, file_extension, original_filename, file_size) VALUES ($1, $2, $3, $4)',
    [
      id,
      validated.file_extension,
      validated.original_filename ?? null,
      validated.file_size ?? null,
    ]
  );

  return id;
};
