import { parseWholeNumberInput } from '../base-entity-content-sections';

export const parseWholeNumberInRange = (
  raw: string,
  min: number,
): { valid: true; value: number | null } | { valid: false } => {
  const parsed = parseWholeNumberInput(raw);
  // The invalid guard only narrows the type: an invalid parse has no `value`, which fails the comparison below anyway. The empty field is returned before the comparison because `null >= min` holds for a `min` of 0 and fails above it.
  if (!parsed.valid) return parsed;
  if (parsed.value === null) return parsed;
  return parsed.value >= min ? parsed : { valid: false };
};
