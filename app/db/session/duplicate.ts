import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { get } from './get';

export const duplicate = async (sourceId: string): Promise<string> => {
  assertValidId(sourceId, 'session');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Session not found: ${sourceId}`);
  }

  const id = generateId();
  const timestamps = generateDbTimestamps();

  // The copied column set is derived by exclusion rather than listed, so a column added to sessions later is duplicated without touching this file. name is excluded so the column takes SQL NULL. active_view is copied, not omitted, so the duplicate opens in the view the source was left in.
  const {
    id: _sourceRowId,
    name: _sourceName,
    created_at: _sourceCreatedAt,
    updated_at: _sourceUpdatedAt,
    ...copiedColumns
  } = source;

  // `?? null` is a type-level normalization, not a runtime fallback: SELECT * yields null for an unset column, but the schema's optional zod fields type these values as possibly undefined.
  const copiedValues: Record<string, string | number | null> =
    Object.fromEntries(
      Object.entries(copiedColumns).map(
        ([column, value]): [string, string | number | null] => [
          column,
          value ?? null,
        ],
      ),
    );

  const { sql, values } = buildCreateQuery<
    Record<string, string | number | null>
  >('sessions', id, {
    ...copiedValues,
    created_at: timestamps.created_at,
    updated_at: timestamps.updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
