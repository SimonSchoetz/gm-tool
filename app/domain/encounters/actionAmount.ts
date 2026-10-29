import { parseWholeNumberInput } from '../base-entity-content-sections';

export const parseActionAmount = (raw: string): number | null => {
  const parsed = parseWholeNumberInput(raw);
  if (!parsed.valid || parsed.value === null) return null;
  return parsed.value >= 0 ? parsed.value : null;
};
