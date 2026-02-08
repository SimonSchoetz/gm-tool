import { getDatabase } from '../database';
import type { Npc } from './types';

export const getAll = async (adventureId: string): Promise<Npc[]> => {
  const db = await getDatabase();

  const data = await db.select<Npc[]>(
    'SELECT * FROM npcs WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId]
  );

  return data;
};
