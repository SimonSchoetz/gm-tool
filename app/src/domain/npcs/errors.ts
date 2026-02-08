export class NpcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NpcError';
  }
}

export class NpcNotFoundError extends NpcError {
  constructor(id: string) {
    super(`NPC with id ${id} not found`);
    this.name = 'NpcNotFoundError';
  }
}

export class NpcLoadError extends NpcError {
  constructor(cause?: unknown) {
    super(`Failed to load NPCs: ${cause}`);
    this.name = 'NpcLoadError';
  }
}

export class NpcCreateError extends NpcError {
  constructor(cause?: unknown) {
    super(`Failed to create NPC: ${cause}`);
    this.name = 'NpcCreateError';
  }
}

export class NpcUpdateError extends NpcError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to update NPC ${id}: ${cause}`);
    this.name = 'NpcUpdateError';
  }
}

export class NpcDeleteError extends NpcError {
  constructor(id: string, cause?: unknown) {
    super(`Failed to delete NPC ${id}: ${cause}`);
    this.name = 'NpcDeleteError';
  }
}
