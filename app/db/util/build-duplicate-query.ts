import { buildCreateQuery } from './build-create-query';
import { generateDbTimestamps } from './generate-db-timestamps';

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
