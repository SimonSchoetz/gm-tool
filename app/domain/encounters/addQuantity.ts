import { parseWholeNumberInRange } from './wholeNumberInRange';

export const MIN_ADD_QUANTITY = 1;
// The ceiling keeps one INSERT of all added combatants far below SQLite's bound-parameter cap (32766 in the bundled libsqlite3-sys).
export const MAX_ADD_QUANTITY = 99;

export const parseAddQuantity = (raw: string): number | null => {
  const parsed = parseWholeNumberInRange(
    raw,
    MIN_ADD_QUANTITY,
    MAX_ADD_QUANTITY,
  );
  return parsed.valid ? parsed.value : null;
};
