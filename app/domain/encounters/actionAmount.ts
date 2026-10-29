import { parseWholeNumberInput } from '../base-entity-content-sections';

export const parseActionAmount = (raw: string): number | null => {
  const parsed = parseWholeNumberInput(raw);
  // Stryker disable next-line ConditionalExpression: an invalid parse leaves `value` undefined, which fails the comparison below, so no input observes a difference
  if (!parsed.valid) return null;
  // Stryker disable next-line ConditionalExpression: a null `value` passes the comparison below and is returned as null, so no input observes a difference
  if (parsed.value === null) return null;
  return parsed.value >= 0 ? parsed.value : null;
};
