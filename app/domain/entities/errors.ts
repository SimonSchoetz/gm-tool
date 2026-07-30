export type EntityTypeError = Error & { name: 'EntityTypeError' };
export const entityTypeError = (entityType: string): EntityTypeError => {
  const error = new Error(
    `Unknown entity type: "${entityType}"`,
  ) as EntityTypeError;
  error.name = 'EntityTypeError';
  return error;
};
