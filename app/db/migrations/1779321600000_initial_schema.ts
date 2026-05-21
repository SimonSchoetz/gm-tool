import type Database from '@tauri-apps/plugin-sql';
import { imageTable } from '../image/schema';
import { adventureTable } from '../adventure/schema';
import { sessionTable } from '../session/schema';
import { sessionStepTable } from '../session-step/schema';
import { npcTable } from '../npc/schema';
import { foeTable } from '../foe/schema';
import { itemTable } from '../item/schema';
import { locationTable } from '../location/schema';
import { factionTable } from '../faction/schema';
import { pcTable } from '../pc/schema';
import { tableConfigTable } from '../table-config/schema';

const up = async (db: Database): Promise<void> => {
  await db.execute(imageTable.createTableSQL);
  await db.execute(adventureTable.createTableSQL);
  await db.execute(sessionTable.createTableSQL);
  await db.execute(sessionStepTable.createTableSQL);
  await db.execute(npcTable.createTableSQL);
  await db.execute(foeTable.createTableSQL);
  await db.execute(itemTable.createTableSQL);
  await db.execute(locationTable.createTableSQL);
  await db.execute(factionTable.createTableSQL);
  await db.execute(pcTable.createTableSQL);
  await db.execute(tableConfigTable.createTableSQL);
};

export const initialSchemaMigration = {
  id: '1779321600000',
  up,
};
