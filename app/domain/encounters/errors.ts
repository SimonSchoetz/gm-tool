type EncounterNotFoundError = Error & { name: 'EncounterNotFoundError' };
export const encounterNotFoundError = (id: string): EncounterNotFoundError => {
  const error = new Error(
    `Encounter with id ${id} not found`,
  ) as EncounterNotFoundError;
  error.name = 'EncounterNotFoundError';
  return error;
};

type EncounterLoadError = Error & { name: 'EncounterLoadError' };
export const encounterLoadError = (cause?: unknown): EncounterLoadError => {
  const error = new Error(
    `Failed to load Encounters: ${String(cause)}`,
  ) as EncounterLoadError;
  error.name = 'EncounterLoadError';
  return error;
};

type EncounterCreateError = Error & { name: 'EncounterCreateError' };
export const encounterCreateError = (cause?: unknown): EncounterCreateError => {
  const error = new Error(
    `Failed to create Encounter: ${String(cause)}`,
  ) as EncounterCreateError;
  error.name = 'EncounterCreateError';
  return error;
};

type EncounterUpdateError = Error & { name: 'EncounterUpdateError' };
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

type EncounterDeleteError = Error & { name: 'EncounterDeleteError' };
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

type EncounterDuplicateError = Error & {
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

type EncounterQueueLoadError = Error & { name: 'EncounterQueueLoadError' };
export const encounterQueueLoadError = (
  cause?: unknown,
): EncounterQueueLoadError => {
  const error = new Error(
    `Failed to load the encounter queue: ${String(cause)}`,
  ) as EncounterQueueLoadError;
  error.name = 'EncounterQueueLoadError';
  return error;
};

type EncounterQueueAddError = Error & { name: 'EncounterQueueAddError' };
export const encounterQueueAddError = (
  cause?: unknown,
): EncounterQueueAddError => {
  const error = new Error(
    `Failed to add combatants to the encounter queue: ${String(cause)}`,
  ) as EncounterQueueAddError;
  error.name = 'EncounterQueueAddError';
  return error;
};

type EncounterQueueReorderError = Error & {
  name: 'EncounterQueueReorderError';
};
export const encounterQueueReorderError = (
  cause?: unknown,
): EncounterQueueReorderError => {
  const error = new Error(
    `Failed to reorder the encounter queue: ${String(cause)}`,
  ) as EncounterQueueReorderError;
  error.name = 'EncounterQueueReorderError';
  return error;
};

type EncounterLogLoadError = Error & { name: 'EncounterLogLoadError' };
export const encounterLogLoadError = (
  cause?: unknown,
): EncounterLogLoadError => {
  const error = new Error(
    `Failed to load the encounter log: ${String(cause)}`,
  ) as EncounterLogLoadError;
  error.name = 'EncounterLogLoadError';
  return error;
};

type EncounterLogRecordError = Error & { name: 'EncounterLogRecordError' };
export const encounterLogRecordError = (
  cause?: unknown,
): EncounterLogRecordError => {
  const error = new Error(
    `Failed to record an encounter log entry: ${String(cause)}`,
  ) as EncounterLogRecordError;
  error.name = 'EncounterLogRecordError';
  return error;
};
