import { buildCreateQuery } from './build-create-query';
import { generateDbTimestamps } from './generate-db-timestamps';

// copiedColumns is the source row with id, created_at, and updated_at always destructured away — this function supplies id via newId and generates fresh timestamps itself — plus whatever else the caller excludes; deriving the copied set by exclusion instead of enumeration means a column added to the table later is duplicated without any caller change. A column the caller excludes and does not restore via overrides is omitted from the INSERT entirely and takes its SQL default — how a caller excluding name produces an unnamed duplicate. overrides re-supplies a column the caller excluded but must set itself, such as a freshly duplicated image_id or the target parent id.
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
