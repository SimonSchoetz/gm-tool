export type FoeNotFoundError = Error & { name: 'FoeNotFoundError' };
export const foeNotFoundError = (id: string): FoeNotFoundError => {
  const error = new Error(`Foe with id ${id} not found`) as FoeNotFoundError;
  error.name = 'FoeNotFoundError';
  return error;
};

export type FoeLoadError = Error & { name: 'FoeLoadError' };
export const foeLoadError = (cause?: unknown): FoeLoadError => {
  const error = new Error(
    `Failed to load Foes: ${String(cause)}`,
  ) as FoeLoadError;
  error.name = 'FoeLoadError';
  return error;
};

export type FoeCreateError = Error & { name: 'FoeCreateError' };
export const foeCreateError = (cause?: unknown): FoeCreateError => {
  const error = new Error(
    `Failed to create Foe: ${String(cause)}`,
  ) as FoeCreateError;
  error.name = 'FoeCreateError';
  return error;
};

export type FoeUpdateError = Error & { name: 'FoeUpdateError' };
export const foeUpdateError = (id: string, cause?: unknown): FoeUpdateError => {
  const error = new Error(
    `Failed to update Foe ${id}: ${String(cause)}`,
  ) as FoeUpdateError;
  error.name = 'FoeUpdateError';
  return error;
};

export type FoeDeleteError = Error & { name: 'FoeDeleteError' };
export const foeDeleteError = (id: string, cause?: unknown): FoeDeleteError => {
  const error = new Error(
    `Failed to delete Foe ${id}: ${String(cause)}`,
  ) as FoeDeleteError;
  error.name = 'FoeDeleteError';
  return error;
};
