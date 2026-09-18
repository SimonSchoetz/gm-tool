import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { baseEntityContentSectionTable } from './schema';
import type { UpdateBaseEntityContentSectionInput } from './types';

export const update = async (
  id: string,
  data: UpdateBaseEntityContentSectionInput,
): Promise<void> => {
  assertValidId(id, 'Base entity content section');
  assertHasUpdateFields(data);

  const validated = baseEntityContentSectionTable.updateSchema.parse(data);
  const db = await getDatabase();
  const { sql, values } = buildUpdateQuery(
    'base_entity_content_sections',
    id,
    validated,
  );

  await db.execute(sql, values);
};
