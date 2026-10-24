import { z } from 'zod';

const wholeNumberSchema = z.int().nullable();

export const parseWholeNumberInput = (
  raw: string,
): { valid: true; value: number | null } | { valid: false } => {
  if (raw.trim() === '') {
    return { valid: true, value: null };
  }
  const result = wholeNumberSchema.safeParse(Number(raw));
  return result.success
    ? { valid: true, value: result.data }
    : { valid: false };
};
