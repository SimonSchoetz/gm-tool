export class SessionStepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionStepError';
  }
}

export class SessionStepLoadError extends SessionStepError {
  constructor(cause?: unknown) {
    super(`Failed to load session steps: ${cause}`);
    this.name = 'SessionStepLoadError';
  }
}

export class SessionStepCreateError extends SessionStepError {
  constructor(cause?: unknown) {
    super(`Failed to create session step: ${cause}`);
    this.name = 'SessionStepCreateError';
  }
}

export class SessionStepUpdateError extends SessionStepError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to update session step ${id}: ${cause}`);
    this.name = 'SessionStepUpdateError';
  }
}

export class SessionStepDeleteError extends SessionStepError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to delete session step ${id}: ${cause}`);
    this.name = 'SessionStepDeleteError';
  }
}

export class SessionStepReorderError extends SessionStepError {
  constructor(cause?: unknown) {
    super(`Failed to reorder session steps: ${cause}`);
    this.name = 'SessionStepReorderError';
  }
}
