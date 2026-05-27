export type ItemNotFoundError = Error & { name: 'ItemNotFoundError' };
export const itemNotFoundError = (id: string): ItemNotFoundError => {
  const error = new Error(`Item with id ${id} not found`) as ItemNotFoundError;
  error.name = 'ItemNotFoundError';
  return error;
};

export type ItemLoadError = Error & { name: 'ItemLoadError' };
export const itemLoadError = (cause?: unknown): ItemLoadError => {
  const error = new Error(
    `Failed to load Items: ${String(cause)}`,
  ) as ItemLoadError;
  error.name = 'ItemLoadError';
  return error;
};

export type ItemCreateError = Error & { name: 'ItemCreateError' };
export const itemCreateError = (cause?: unknown): ItemCreateError => {
  const error = new Error(
    `Failed to create Item: ${String(cause)}`,
  ) as ItemCreateError;
  error.name = 'ItemCreateError';
  return error;
};

export type ItemUpdateError = Error & { name: 'ItemUpdateError' };
export const itemUpdateError = (
  id: string,
  cause?: unknown,
): ItemUpdateError => {
  const error = new Error(
    `Failed to update Item ${id}: ${String(cause)}`,
  ) as ItemUpdateError;
  error.name = 'ItemUpdateError';
  return error;
};

export type ItemDeleteError = Error & { name: 'ItemDeleteError' };
export const itemDeleteError = (
  id: string,
  cause?: unknown,
): ItemDeleteError => {
  const error = new Error(
    `Failed to delete Item ${id}: ${String(cause)}`,
  ) as ItemDeleteError;
  error.name = 'ItemDeleteError';
  return error;
};
