export type LocationNotFoundError = Error & { name: 'LocationNotFoundError' };
export const locationNotFoundError = (id: string): LocationNotFoundError => {
  const error = new Error(
    `Location with id ${id} not found`,
  ) as LocationNotFoundError;
  error.name = 'LocationNotFoundError';
  return error;
};

export type LocationLoadError = Error & { name: 'LocationLoadError' };
export const locationLoadError = (cause?: unknown): LocationLoadError => {
  const error = new Error(
    `Failed to load Locations: ${String(cause)}`,
  ) as LocationLoadError;
  error.name = 'LocationLoadError';
  return error;
};

export type LocationCreateError = Error & { name: 'LocationCreateError' };
export const locationCreateError = (cause?: unknown): LocationCreateError => {
  const error = new Error(
    `Failed to create Location: ${String(cause)}`,
  ) as LocationCreateError;
  error.name = 'LocationCreateError';
  return error;
};

export type LocationUpdateError = Error & { name: 'LocationUpdateError' };
export const locationUpdateError = (
  id: string,
  cause?: unknown,
): LocationUpdateError => {
  const error = new Error(
    `Failed to update Location ${id}: ${String(cause)}`,
  ) as LocationUpdateError;
  error.name = 'LocationUpdateError';
  return error;
};

export type LocationDeleteError = Error & { name: 'LocationDeleteError' };
export const locationDeleteError = (
  id: string,
  cause?: unknown,
): LocationDeleteError => {
  const error = new Error(
    `Failed to delete Location ${id}: ${String(cause)}`,
  ) as LocationDeleteError;
  error.name = 'LocationDeleteError';
  return error;
};
