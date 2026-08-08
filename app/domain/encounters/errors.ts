export type EncounterNotFoundError = Error & { name: 'EncounterNotFoundError' };
export const encounterNotFoundError = (id: string): EncounterNotFoundError => {
  const error = new Error(
    `Encounter with id ${id} not found`,
  ) as EncounterNotFoundError;
  error.name = 'EncounterNotFoundError';
  return error;
};

export type EncounterLoadError = Error & { name: 'EncounterLoadError' };
export const encounterLoadError = (cause?: unknown): EncounterLoadError => {
  const error = new Error(
    `Failed to load Encounters: ${String(cause)}`,
  ) as EncounterLoadError;
  error.name = 'EncounterLoadError';
  return error;
};

export type EncounterCreateError = Error & { name: 'EncounterCreateError' };
export const encounterCreateError = (cause?: unknown): EncounterCreateError => {
  const error = new Error(
    `Failed to create Encounter: ${String(cause)}`,
  ) as EncounterCreateError;
  error.name = 'EncounterCreateError';
  return error;
};

export type EncounterUpdateError = Error & { name: 'EncounterUpdateError' };
export const encounterUpdateError = (
  id: string,
  cause?: unknown,
): EncounterUpdateError => {
  const error = new Error(
    `Failed to update Encounter ${id}: ${String(cause)}`,
  ) as EncounterUpdateError;
  error.name = 'EncounterUpdateError';
  return error;
};

export type EncounterDeleteError = Error & { name: 'EncounterDeleteError' };
export const encounterDeleteError = (
  id: string,
  cause?: unknown,
): EncounterDeleteError => {
  const error = new Error(
    `Failed to delete Encounter ${id}: ${String(cause)}`,
  ) as EncounterDeleteError;
  error.name = 'EncounterDeleteError';
  return error;
};

export type EncounterDuplicateError = Error & {
  name: 'EncounterDuplicateError';
};
export const encounterDuplicateError = (
  id: string,
  cause?: unknown,
): EncounterDuplicateError => {
  const error = new Error(
    `Failed to duplicate Encounter ${id}: ${String(cause)}`,
  ) as EncounterDuplicateError;
  error.name = 'EncounterDuplicateError';
  return error;
};
