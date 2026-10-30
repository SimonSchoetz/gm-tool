export const normalizeCustomName = (raw: string | null): string | null => {
  const trimmed = raw?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};
