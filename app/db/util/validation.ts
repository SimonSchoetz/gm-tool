export const assertValidId = (id: string, entityName: string): void => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error(`Valid ${entityName} ID is required`);
  }
};

export const assertHasUpdateFields = (data: Record<string, unknown>): void => {
  const hasFields = Object.values(data).some((value) => value !== undefined);
  if (!hasFields) {
    throw new Error('At least one field must be provided for update');
  }
};
