import { isEntityType, isBaseEntityType } from '@domain/entities';
import { getDatabase } from './database';

type MentionSearchRow = {
  id: string;
  name: string;
  updated_at: string;
};

export const searchByName = async (
  entityType: string,
  query: string,
  adventureId: string | null,
): Promise<MentionSearchRow[]> => {
  if (!isEntityType(entityType)) return [];

  const db = await getDatabase();

  if (isBaseEntityType(entityType)) {
    if (adventureId !== null) {
      return db.select<MentionSearchRow[]>(
        'SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 AND adventure_id = $3 ORDER BY updated_at DESC',
        [entityType, `%${query}%`, adventureId],
      );
    }

    return db.select<MentionSearchRow[]>(
      'SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 ORDER BY updated_at DESC',
      [entityType, `%${query}%`],
    );
  }

  // entityType is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — table_config.table_name is writable by any paired peer over sync, so no caller can be assumed to have validated it. Interpolation only ever happens for non-base entity types; base entity types query base_entities with entity_type as a bound parameter above.
  if (adventureId !== null) {
    return db.select<MentionSearchRow[]>(
      `SELECT id, name, updated_at FROM ${entityType} WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC`,
      [`%${query}%`, adventureId],
    );
  }

  return db.select<MentionSearchRow[]>(
    `SELECT id, name, updated_at FROM ${entityType} WHERE name LIKE $1 ORDER BY updated_at DESC`,
    [`%${query}%`],
  );
};

export const getById = async (
  entityType: string,
  id: string,
): Promise<MentionSearchRow | null> => {
  if (!isEntityType(entityType)) return null;

  const db = await getDatabase();

  if (isBaseEntityType(entityType)) {
    const rows = await db.select<MentionSearchRow[]>(
      'SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND id = $2',
      [entityType, id],
    );

    return rows[0] ?? null;
  }

  // entityType is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — callers are not assumed to have validated it. Interpolation only ever happens for non-base entity types.
  const rows = await db.select<MentionSearchRow[]>(
    `SELECT id, name, updated_at FROM ${entityType} WHERE id = $1`,
    [id],
  );

  return rows[0] ?? null;
};
