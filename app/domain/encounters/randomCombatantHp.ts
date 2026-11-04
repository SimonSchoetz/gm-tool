import { parseNonNegativeWholeNumber } from './nonNegativeWholeNumber';

// Unlike `parseActionAmount`, this tells an empty field (no HP) from an invalid one, so Add is never enabled with a typed HP silently dropped.
export const parseRandomCombatantHp = (
  raw: string,
): { valid: true; hp: number | null } | { valid: false } => {
  const parsed = parseNonNegativeWholeNumber(raw);
  return parsed.valid ? { valid: true, hp: parsed.value } : parsed;
};
