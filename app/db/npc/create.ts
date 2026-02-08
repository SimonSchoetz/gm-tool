import { getDatabase } from '../database';
import { generateId } from '../../util';
import { npcTable } from './schema';
import type { CreateNpcInput } from './types';

export const create = async (data: CreateNpcInput): Promise<string> => {
  const validated = npcTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();

  await db.execute(
    'INSERT INTO npcs (id, adventure_id, name, rank, faction, hometown, description, image_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [
      id,
      validated.adventure_id,
      validated.name,
      validated.rank ?? null,
      validated.faction ?? null,
      validated.hometown ?? null,
      validated.description ?? null,
      validated.image_id ?? null,
    ]
  );
  return id;
};
