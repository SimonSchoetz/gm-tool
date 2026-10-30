import { parseWholeNumberInput } from '../base-entity-content-sections';

// Unlike `parseActionAmount`, this tells an empty field (no HP) from an invalid one, so Add is never enabled with a typed HP silently dropped.
export const parseRandomCombatantHp = (
  raw: string,
): { valid: true; hp: number | null } | { valid: false } => {
  const parsed = parseWholeNumberInput(raw);
  // Stryker disable next-line ConditionalExpression: an invalid parse leaves `value` undefined, which fails the comparison below, so no input observes a difference
  if (!parsed.valid) return { valid: false };
  // Stryker disable next-line ConditionalExpression: a null `value` passes the comparison below and is returned as hp null, so no input observes a difference
  if (parsed.value === null) return { valid: true, hp: null };
  return parsed.value >= 0
    ? { valid: true, hp: parsed.value }
    : { valid: false };
};
