export class AdventureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdventureError';
  }
}

export class AdventureNotFoundError extends AdventureError {
  constructor(id: string) {
    super(`Adventure with id ${id} not found`);
    this.name = 'AdventureNotFoundError';
  }
}

export class AdventureLoadError extends AdventureError {
  constructor(cause?: unknown) {
    super(`Failed to load adventures: ${cause}`);
    this.name = 'AdventureLoadError';
  }
}

export class AdventureCreateError extends AdventureError {
  constructor(cause?: unknown) {
    super(`Failed to create adventure: ${cause}`);
    this.name = 'AdventureCreateError';
  }
}

export class AdventureUpdateError extends AdventureError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to update adventure ${id}: ${cause}`);
    this.name = 'AdventureUpdateError';
  }
}

export class AdventureDeleteError extends AdventureError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to delete adventure ${id}: ${cause}`);
    this.name = 'AdventureDeleteError';
  }
}

export class DatabaseInitError extends AdventureError {
  constructor(cause?: unknown) {
    super(`Failed to initialize database: ${cause}`);
    this.name = 'DatabaseInitError';
  }
}
