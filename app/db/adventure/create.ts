import { getDatabase } from '../database';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';
import { getDateTimeString } from '@util';

export const create = async (): Promise<string> => {
  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New adventure ${getDateTimeString(now)}`;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const { sql, values } = buildCreateQuery<{
    name: string;
    created_at: string;
    updated_at: string;
  }>('adventures', id, {
    name,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
