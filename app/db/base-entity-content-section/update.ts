import type Database from '@tauri-apps/plugin-sql';
import { assertValidContentSectionContent } from '@domain';
import type { BaseEntityContentSectionType } from '@domain';
import { getDatabase } from '../database';
import {
  assertValidId,
  assertHasUpdateFields,
  buildUpdateQuery,
} from '../util';
import { baseEntityContentSectionTable } from './schema';
import type {
  BaseEntityContentSection,
  UpdateBaseEntityContentSectionInput,
} from './types';

const readStoredType = async (
  db: Database,
  id: string,
): Promise<BaseEntityContentSectionType | null> => {
  const rows = await db.select<Pick<BaseEntityContentSection, 'type'>[]>(
    'SELECT type FROM base_entity_content_sections WHERE id = $1',
    [id],
  );
  return rows[0]?.type ?? null;
};

export const update = async (
  id: string,
  data: UpdateBaseEntityContentSectionInput,
): Promise<void> => {
  assertValidId(id, 'Base entity content section');
  assertHasUpdateFields(data);

  const validated = baseEntityContentSectionTable.updateSchema.parse(data);
  const db = await getDatabase();

  if (typeof validated.content === 'string') {
    const type = validated.type ?? (await readStoredType(db, id));
    if (type !== null) {
      assertValidContentSectionContent(type, validated.content);
    }
  }

  const { sql, values } = buildUpdateQuery(
    'base_entity_content_sections',
    id,
    validated,
  );

  await db.execute(sql, values);
};
