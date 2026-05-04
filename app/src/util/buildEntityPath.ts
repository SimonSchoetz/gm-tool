export const buildEntityPath = (
  entityType: string,
  entityId: string,
  adventureId: string | null,
): string => {
  const entitySegment = entityType.slice(0, -1);
  return adventureId
    ? `/adventure/${adventureId}/${entitySegment}/${entityId}`
    : `/${entitySegment}/${entityId}`;
};
