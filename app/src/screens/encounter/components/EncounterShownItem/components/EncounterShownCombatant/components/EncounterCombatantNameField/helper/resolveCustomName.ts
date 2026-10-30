import { normalizeQueueItemName } from '@domain';

export const resolveCustomName = (
  typed: string,
  automaticName: string,
): string | null => {
  const normalized = normalizeQueueItemName(typed);
  return normalized === automaticName ? null : normalized;
};
