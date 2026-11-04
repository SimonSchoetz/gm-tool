import { parseNonNegativeWholeNumber } from './nonNegativeWholeNumber';

export const parseActionAmount = (raw: string): number | null => {
  const parsed = parseNonNegativeWholeNumber(raw);
  return parsed.valid ? parsed.value : null;
};
