import { parseWholeNumberInput } from '../base-entity-content-sections';

export const parseNonNegativeWholeNumber = (
  raw: string,
): { valid: true; value: number | null } | { valid: false } => {
  const parsed = parseWholeNumberInput(raw);
  // The invalid guard only narrows the type: an invalid parse has no `value`, which fails the comparison below anyway. The empty field is returned before the comparison because it has no number to compare.
  if (!parsed.valid) return parsed;
  if (parsed.value === null) return parsed;
  return parsed.value >= 0 ? parsed : { valid: false };
};
