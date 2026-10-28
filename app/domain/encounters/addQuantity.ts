import { parseWholeNumberInput } from '../base-entity-content-sections';

export const MIN_ADD_QUANTITY = 1;
// The ceiling keeps one INSERT of all added combatants far below SQLite's bound-parameter cap (32766 in the bundled libsqlite3-sys).
export const MAX_ADD_QUANTITY = 99;

export const parseAddQuantity = (raw: string): number | null => {
  const parsed = parseWholeNumberInput(raw);
  // Stryker disable next-line ConditionalExpression: an invalid parse leaves `value` undefined, which fails both range comparisons below, so no input observes a difference
  if (!parsed.valid) return null;
  // Stryker disable next-line ConditionalExpression: a null `value` fails both range comparisons below, so no input observes a difference
  if (parsed.value === null) return null;
  return parsed.value >= MIN_ADD_QUANTITY && parsed.value <= MAX_ADD_QUANTITY
    ? parsed.value
    : null;
};
