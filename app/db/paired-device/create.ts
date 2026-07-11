import { getDatabase } from '../database';
import { buildCreateQuery, generateDbTimestamps } from '../util';
import { pairedDeviceTable } from './schema';

type CreatePairedDeviceInput = {
  id: string;
  name: string | null;
};

// id is the peer's iroh EndpointId (64-char hex), supplied by the pairing flow —
// not a generated nanoid like every other table.
export const create = async (
  input: CreatePairedDeviceInput,
): Promise<string> => {
  const validated = pairedDeviceTable.zodSchema
    .pick({ id: true, name: true })
    .parse(input);
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<{
    name: string | null;
    created_at: string;
    updated_at: string;
  }>('paired_devices', validated.id, {
    name: validated.name ?? null,
    created_at,
    updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return validated.id;
};
