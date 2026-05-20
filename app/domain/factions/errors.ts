export type FactionNotFoundError = Error & { name: 'FactionNotFoundError' };
export const factionNotFoundError = (id: string): FactionNotFoundError => {
  const error = new Error(`Faction with id ${id} not found`) as FactionNotFoundError;
  error.name = 'FactionNotFoundError';
  return error;
};

export type FactionLoadError = Error & { name: 'FactionLoadError' };
export const factionLoadError = (cause?: unknown): FactionLoadError => {
  const error = new Error(
    `Failed to load Factions: ${String(cause)}`,
  ) as FactionLoadError;
  error.name = 'FactionLoadError';
  return error;
};

export type FactionCreateError = Error & { name: 'FactionCreateError' };
export const factionCreateError = (cause?: unknown): FactionCreateError => {
  const error = new Error(
    `Failed to create Faction: ${String(cause)}`,
  ) as FactionCreateError;
  error.name = 'FactionCreateError';
  return error;
};

export type FactionUpdateError = Error & { name: 'FactionUpdateError' };
export const factionUpdateError = (id: string, cause?: unknown): FactionUpdateError => {
  const error = new Error(
    `Failed to update Faction ${id}: ${String(cause)}`,
  ) as FactionUpdateError;
  error.name = 'FactionUpdateError';
  return error;
};

export type FactionDeleteError = Error & { name: 'FactionDeleteError' };
export const factionDeleteError = (id: string, cause?: unknown): FactionDeleteError => {
  const error = new Error(
    `Failed to delete Faction ${id}: ${String(cause)}`,
  ) as FactionDeleteError;
  error.name = 'FactionDeleteError';
  return error;
};
