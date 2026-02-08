import { getDatabase } from '../database';
import type { Npc } from './types';

export const get = async (id: string): Promise<Npc | null> => {
  const db = await getDatabase();

  const result = await db.select<Npc[]>(
    'SELECT * FROM npcs WHERE id = $1',
    [id]
  );

  return result[0] ?? null;
};
