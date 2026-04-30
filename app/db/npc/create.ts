import { getDatabase } from '../database';
import { generateId, buildCreateQuery } from '../util';
import { npcTable } from './schema';
import type { CreateNpcInput } from './types';

const templates = {
  summary: `{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Pronouns | Species | Age","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Hometown | Profession","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Faction | Rank","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Behavior | Wants | Needs | Bonds | Secrets","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""},{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Stat Block","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}}`,
};

export const create = async (data: CreateNpcInput): Promise<string> => {
  const validated = npcTable.createSchema.parse(data);

  const id = generateId();
  const { sql, values } = buildCreateQuery('npcs', id, {
    ...validated,
    summary: templates.summary,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
