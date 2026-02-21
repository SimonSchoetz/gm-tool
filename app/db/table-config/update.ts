import { getDatabase } from '../database';
import { assertValidId, assertHasUpdateFields, buildUpdateQuery } from '../util';
import { tableConfigTable } from './schema';
import { tableLayoutSchema } from './layout-schema';
import type { UpdateTableConfigInput } from './types';

export const update = async (
  id: string,
  data: UpdateTableConfigInput,
): Promise<void> => {
  assertValidId(id, 'table config');
  assertHasUpdateFields(data);

  let layoutString: string | undefined;
  if (data.layout !== undefined) {
    const layoutResult = tableLayoutSchema.safeParse(data.layout);
    if (!layoutResult.success) {
      throw new Error(`Invalid layout: ${layoutResult.error.message}`);
    }
    layoutString = JSON.stringify(layoutResult.data);
  }

  const validated = tableConfigTable.updateSchema.parse({
    ...data,
    layout: layoutString,
  });

  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery('table_config', id, validated);

  await db.execute(sql, values);
};
