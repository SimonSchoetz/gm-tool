export type PinnedOrderError = Error & { name: 'PinnedOrderError' };
export const pinnedOrderError = (cause?: unknown): PinnedOrderError => {
  const error = new Error(
    `Failed to update pinned order: ${String(cause)}`,
  ) as PinnedOrderError;
  error.name = 'PinnedOrderError';
  return error;
};
