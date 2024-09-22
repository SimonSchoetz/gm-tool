export const getIdListWithoutExtraRows = (
  ids: string[],
  amountExtraRows: number
): string[] => {
  const lastId = ids.at(-1);
  if (!lastId) return [];
  const [_x, y] = lastId.split('-').map(Number);
  const amountExtraSquares = y * amountExtraRows;
  return ids.slice(0, -amountExtraSquares);
};
