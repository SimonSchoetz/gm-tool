export type SessionStepLoadError = Error & { name: 'SessionStepLoadError' };
export const sessionStepLoadError = (cause?: unknown): SessionStepLoadError => {
  const error = new Error(`Failed to load session steps: ${cause}`) as SessionStepLoadError;
  error.name = 'SessionStepLoadError';
  return error;
};

export type SessionStepCreateError = Error & { name: 'SessionStepCreateError' };
export const sessionStepCreateError = (cause?: unknown): SessionStepCreateError => {
  const error = new Error(`Failed to create session step: ${cause}`) as SessionStepCreateError;
  error.name = 'SessionStepCreateError';
  return error;
};

export type SessionStepUpdateError = Error & { name: 'SessionStepUpdateError' };
export const sessionStepUpdateError = (id: string, cause?: unknown): SessionStepUpdateError => {
  const error = new Error(`Failed to update session step ${id}: ${cause}`) as SessionStepUpdateError;
  error.name = 'SessionStepUpdateError';
  return error;
};

export type SessionStepDeleteError = Error & { name: 'SessionStepDeleteError' };
export const sessionStepDeleteError = (id: string, cause?: unknown): SessionStepDeleteError => {
  const error = new Error(`Failed to delete session step ${id}: ${cause}`) as SessionStepDeleteError;
  error.name = 'SessionStepDeleteError';
  return error;
};

export type SessionStepReorderError = Error & { name: 'SessionStepReorderError' };
export const sessionStepReorderError = (cause?: unknown): SessionStepReorderError => {
  const error = new Error(`Failed to reorder session steps: ${cause}`) as SessionStepReorderError;
  error.name = 'SessionStepReorderError';
  return error;
};
