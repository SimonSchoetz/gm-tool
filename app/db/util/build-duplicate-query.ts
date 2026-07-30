import { buildCreateQuery } from './build-create-query';
import { generateDbTimestamps } from './generate-db-timestamps';

// Callers pass copiedColumns as a rest-spread of the source row with id, name, created_at and updated_at destructured away — deriving the copied set by exclusion instead of enumerating it means a column added to the table later is duplicated without touching the caller; the excluded name column takes SQL NULL so a duplicate arrives unnamed, and a caller whose entity owns an image excludes image_id too and re-supplies the freshly duplicated one through overrides.
export const buildDuplicateQuery = (
  tableName: string,
  newId: string,
  copiedColumns: Record<string, string | number | null | undefined>,
  overrides: Record<string, string | number | null>,
): { sql: string; values: unknown[] } => {
  const { created_at, updated_at } = generateDbTimestamps();

  // `?? null` is a type-level normalization, not a runtime fallback: SELECT * yields null for an unset column, but the schema's optional zod fields type these values as possibly undefined.
  const normalizedCopiedValues: Record<string, string | number | null> =
    Object.fromEntries(
      Object.entries(copiedColumns).map(
        ([column, value]): [string, string | number | null] => [
          column,
          value ?? null,
        ],
      ),
    );

  return buildCreateQuery<Record<string, string | number | null>>(
    tableName,
    newId,
    {
      ...normalizedCopiedValues,
      ...overrides,
      created_at,
      updated_at,
    },
  );
};
