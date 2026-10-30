import { normalizeCustomName } from '@domain';

export const resolveCustomName = (
  typed: string,
  automaticName: string,
): string | null => {
  const normalized = normalizeCustomName(typed);
  return normalized === automaticName ? null : normalized;
};
