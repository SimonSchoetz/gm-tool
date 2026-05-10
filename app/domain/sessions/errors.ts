export type SessionNotFoundError = Error & { name: 'SessionNotFoundError' };
export const sessionNotFoundError = (id: string): SessionNotFoundError => {
  const error = new Error(
    `Session with id ${id} not found`,
  ) as SessionNotFoundError;
  error.name = 'SessionNotFoundError';
  return error;
};

export type SessionLoadError = Error & { name: 'SessionLoadError' };
export const sessionLoadError = (cause?: unknown): SessionLoadError => {
  const error = new Error(
    `Failed to load sessions: ${String(cause)}`,
  ) as SessionLoadError;
  error.name = 'SessionLoadError';
  return error;
};

export type SessionCreateError = Error & { name: 'SessionCreateError' };
export const sessionCreateError = (cause?: unknown): SessionCreateError => {
  const error = new Error(
    `Failed to create session: ${String(cause)}`,
  ) as SessionCreateError;
  error.name = 'SessionCreateError';
  return error;
};

export type SessionUpdateError = Error & { name: 'SessionUpdateError' };
export const sessionUpdateError = (
  id: string,
  cause?: unknown,
): SessionUpdateError => {
  const error = new Error(
    `Failed to update session ${id}: ${String(cause)}`,
  ) as SessionUpdateError;
  error.name = 'SessionUpdateError';
  return error;
};

export type SessionDeleteError = Error & { name: 'SessionDeleteError' };
export const sessionDeleteError = (
  id: string,
  cause?: unknown,
): SessionDeleteError => {
  const error = new Error(
    `Failed to delete session ${id}: ${String(cause)}`,
  ) as SessionDeleteError;
  error.name = 'SessionDeleteError';
  return error;
};
