import { parseWholeNumberInRange } from './wholeNumberInRange';

export const parseActionAmount = (raw: string): number | null => {
  const parsed = parseWholeNumberInRange(raw, 0);
  return parsed.valid ? parsed.value : null;
};
