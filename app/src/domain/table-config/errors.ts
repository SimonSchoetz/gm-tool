export class TableConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TableConfigError';
  }
}

export class TableConfigNotFoundError extends TableConfigError {
  constructor(id: string) {
    super(`Table config with id ${id} not found`);
    this.name = 'TableConfigNotFoundError';
  }
}

export class TableConfigLoadError extends TableConfigError {
  constructor(cause?: unknown) {
    super(`Failed to load table configs: ${cause}`);
    this.name = 'TableConfigLoadError';
  }
}

export class TableConfigUpdateError extends TableConfigError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to update table config ${id}: ${cause}`);
    this.name = 'TableConfigUpdateError';
  }
}
