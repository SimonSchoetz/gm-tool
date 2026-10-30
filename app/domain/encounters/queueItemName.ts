export const normalizeQueueItemName = (raw: string | null): string | null => {
  const trimmed = raw?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};
