export type AdventureNotFoundError = Error & { name: 'AdventureNotFoundError' };
export const adventureNotFoundError = (id: string): AdventureNotFoundError => {
  const error = new Error(`Adventure with id ${id} not found`) as AdventureNotFoundError;
  error.name = 'AdventureNotFoundError';
  return error;
};

export type AdventureLoadError = Error & { name: 'AdventureLoadError' };
export const adventureLoadError = (cause?: unknown): AdventureLoadError => {
  const error = new Error(`Failed to load adventures: ${cause}`) as AdventureLoadError;
  error.name = 'AdventureLoadError';
  return error;
};

export type AdventureCreateError = Error & { name: 'AdventureCreateError' };
export const adventureCreateError = (cause?: unknown): AdventureCreateError => {
  const error = new Error(`Failed to create adventure: ${cause}`) as AdventureCreateError;
  error.name = 'AdventureCreateError';
  return error;
};

export type AdventureUpdateError = Error & { name: 'AdventureUpdateError' };
export const adventureUpdateError = (id: string, cause?: unknown): AdventureUpdateError => {
  const error = new Error(`Failed to update adventure ${id}: ${cause}`) as AdventureUpdateError;
  error.name = 'AdventureUpdateError';
  return error;
};

export type AdventureDeleteError = Error & { name: 'AdventureDeleteError' };
export const adventureDeleteError = (id: string, cause?: unknown): AdventureDeleteError => {
  const error = new Error(`Failed to delete adventure ${id}: ${cause}`) as AdventureDeleteError;
  error.name = 'AdventureDeleteError';
  return error;
};

export type DatabaseInitError = Error & { name: 'DatabaseInitError' };
export const databaseInitError = (cause?: unknown): DatabaseInitError => {
  const error = new Error(`Failed to initialize database: ${cause}`) as DatabaseInitError;
  error.name = 'DatabaseInitError';
  return error;
};
