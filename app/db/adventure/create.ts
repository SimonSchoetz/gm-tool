import { getDatabase } from '../database';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';
import { getDateTimeString } from '@util/getDateTimeString';

export const create = async (): Promise<string> => {
  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New adventure ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery('adventures', id, {
    name,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
