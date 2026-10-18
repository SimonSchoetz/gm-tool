export const getIdAfterRemoval = (
  ids: string[],
  removedId: string,
): string | null => {
  const index = ids.indexOf(removedId);
  if (index === -1) return null;

  const nextId = ids.at(index + 1);
  if (nextId !== undefined) return nextId;

  return index > 0 ? (ids.at(index - 1) ?? null) : null;
};
