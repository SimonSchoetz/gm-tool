export const mentionEntityKeys = {
  detail: (entityType: string, entityId: string) =>
    ['mentionEntityData', entityType, entityId] as const,
};
