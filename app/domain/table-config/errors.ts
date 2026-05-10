export type TableConfigNotFoundError = Error & {
  name: 'TableConfigNotFoundError';
};
export const tableConfigNotFoundError = (
  id: string,
): TableConfigNotFoundError => {
  const error = new Error(
    `Table config with id ${id} not found`,
  ) as TableConfigNotFoundError;
  error.name = 'TableConfigNotFoundError';
  return error;
};

export type TableConfigLoadError = Error & { name: 'TableConfigLoadError' };
export const tableConfigLoadError = (cause?: unknown): TableConfigLoadError => {
  const error = new Error(
    `Failed to load table configs: ${String(cause)}`,
  ) as TableConfigLoadError;
  error.name = 'TableConfigLoadError';
  return error;
};

export type TableConfigUpdateError = Error & { name: 'TableConfigUpdateError' };
export const tableConfigUpdateError = (
  id: string,
  cause?: unknown,
): TableConfigUpdateError => {
  const error = new Error(
    `Failed to update table config ${id}: ${String(cause)}`,
  ) as TableConfigUpdateError;
  error.name = 'TableConfigUpdateError';
  return error;
};
