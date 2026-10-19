export const getIdAfterRemoval = (
  ids: string[],
  removedId: string,
): string | null => {
  const index = ids.indexOf(removedId);
  if (index === -1) return null;

  if (index + 1 < ids.length) return ids[index + 1];
  if (index > 0) return ids[index - 1];
  return null;
};
