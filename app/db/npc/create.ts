import { getDatabase } from '../database';
import { generateId } from '../../util';
import { npcTable } from './schema';
import type { CreateNpcInput, Npc } from './types';

const templates = {
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Sex | Species | Age","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hometown | Profession","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Faction | Rank","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Behavior | Wants | Needs | Bonds | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Stat Block","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (data: CreateNpcInput): Promise<string> => {
  const validated = npcTable.createSchema.parse(data);

  const id = generateId();

  const fieldsToInsert: Npc = {
    id,
    adventure_id: validated.adventure_id,
    name: validated.name,
    summary: templates.summary,
  };

  const columnNames = Object.keys(fieldsToInsert);
  const values = Object.values(fieldsToInsert);
  const paramIndex = columnNames.map((_, i) => `$${i + 1}`).join(', ');

  const db = await getDatabase();
  await db.execute(
    `INSERT INTO npcs (${columnNames.join(', ')}) VALUES (${paramIndex})`,
    values,
  );
  return id;
};
