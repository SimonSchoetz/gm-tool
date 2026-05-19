export type PcNotFoundError = Error & { name: 'PcNotFoundError' };
export const pcNotFoundError = (id: string): PcNotFoundError => {
  const error = new Error(`Pc with id ${id} not found`) as PcNotFoundError;
  error.name = 'PcNotFoundError';
  return error;
};

export type PcLoadError = Error & { name: 'PcLoadError' };
export const pcLoadError = (cause?: unknown): PcLoadError => {
  const error = new Error(
    `Failed to load Pcs: ${String(cause)}`,
  ) as PcLoadError;
  error.name = 'PcLoadError';
  return error;
};

export type PcCreateError = Error & { name: 'PcCreateError' };
export const pcCreateError = (cause?: unknown): PcCreateError => {
  const error = new Error(
    `Failed to create Pc: ${String(cause)}`,
  ) as PcCreateError;
  error.name = 'PcCreateError';
  return error;
};

export type PcUpdateError = Error & { name: 'PcUpdateError' };
export const pcUpdateError = (id: string, cause?: unknown): PcUpdateError => {
  const error = new Error(
    `Failed to update Pc ${id}: ${String(cause)}`,
  ) as PcUpdateError;
  error.name = 'PcUpdateError';
  return error;
};

export type PcDeleteError = Error & { name: 'PcDeleteError' };
export const pcDeleteError = (id: string, cause?: unknown): PcDeleteError => {
  const error = new Error(
    `Failed to delete Pc ${id}: ${String(cause)}`,
  ) as PcDeleteError;
  error.name = 'PcDeleteError';
  return error;
};
