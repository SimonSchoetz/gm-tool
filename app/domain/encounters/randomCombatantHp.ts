import { parseWholeNumberInRange } from './wholeNumberInRange';

// Unlike `parseActionAmount`, this tells an empty field (no HP) from an invalid one, so Add is never enabled with a typed HP silently dropped.
export const parseRandomCombatantHp = (
  raw: string,
): { valid: true; hp: number | null } | { valid: false } => {
  const parsed = parseWholeNumberInRange(raw, 0);
  return parsed.valid ? { valid: true, hp: parsed.value } : parsed;
};
