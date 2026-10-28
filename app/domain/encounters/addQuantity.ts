import { parseWholeNumberInput } from '../base-entity-content-sections';

const MIN_ADD_QUANTITY = 1;
// The ceiling keeps one INSERT of all added combatants far below SQLite's bound-parameter cap (32766 in the bundled libsqlite3-sys).
const MAX_ADD_QUANTITY = 99;

export const parseAddQuantity = (raw: string): number | null => {
  const parsed = parseWholeNumberInput(raw);
  if (!parsed.valid || parsed.value === null) return null;
  return parsed.value >= MIN_ADD_QUANTITY && parsed.value <= MAX_ADD_QUANTITY
    ? parsed.value
    : null;
};
