import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { get } from './get';

export const duplicate = async (
  sourceId: string,
  imageId: string | null,
): Promise<string> => {
  assertValidId(sourceId, 'Faction');

  const source = await get(sourceId);
  if (!source) {
    throw new Error(`Faction not found: ${sourceId}`);
  }

  const id = generateId();
  const timestamps = generateDbTimestamps();

  // The copied column set is derived by exclusion rather than listed, so a column added to factions later is duplicated without touching this file. image_id is excluded because the caller supplies a freshly duplicated image; name is excluded so the column takes SQL NULL.
  const {
    id: _sourceRowId,
    name: _sourceName,
    image_id: _sourceImageId,
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
  >('factions', id, {
    ...copiedValues,
    image_id: imageId,
    created_at: timestamps.created_at,
    updated_at: timestamps.updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
