export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(id: string) {
    super(`Session with id ${id} not found`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionLoadError extends SessionError {
  constructor(cause?: unknown) {
    super(`Failed to load sessions: ${cause}`);
    this.name = 'SessionLoadError';
  }
}

export class SessionCreateError extends SessionError {
  constructor(cause?: unknown) {
    super(`Failed to create session: ${cause}`);
    this.name = 'SessionCreateError';
  }
}

export class SessionUpdateError extends SessionError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to update session ${id}: ${cause}`);
    this.name = 'SessionUpdateError';
  }
}

export class SessionDeleteError extends SessionError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to delete session ${id}: ${cause}`);
    this.name = 'SessionDeleteError';
  }
}
