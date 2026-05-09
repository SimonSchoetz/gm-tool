import { getDateTimeString } from '@/util';
import { getDatabase } from '../database';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';

type DbTimestamps = {
  created_at: string;
  updated_at: string;
};

type CreationData = {
  name: string;
} & DbTimestamps;

export const create = async (): Promise<string> => {
  const id = generateId();

  const { now, ...timeStamps } = generateDbTimestamps();
  const name = `New adventure ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery<CreationData>('adventures', id, {
    name,
    ...timeStamps,
    test: 'test',
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
