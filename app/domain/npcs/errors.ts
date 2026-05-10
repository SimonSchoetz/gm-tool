export type NpcNotFoundError = Error & { name: 'NpcNotFoundError' };
export const npcNotFoundError = (id: string): NpcNotFoundError => {
  const error = new Error(`NPC with id ${id} not found`) as NpcNotFoundError;
  error.name = 'NpcNotFoundError';
  return error;
};

export type NpcLoadError = Error & { name: 'NpcLoadError' };
export const npcLoadError = (cause?: unknown): NpcLoadError => {
  const error = new Error(
    `Failed to load NPCs: ${String(cause)}`,
  ) as NpcLoadError;
  error.name = 'NpcLoadError';
  return error;
};

export type NpcCreateError = Error & { name: 'NpcCreateError' };
export const npcCreateError = (cause?: unknown): NpcCreateError => {
  const error = new Error(
    `Failed to create NPC: ${String(cause)}`,
  ) as NpcCreateError;
  error.name = 'NpcCreateError';
  return error;
};

export type NpcUpdateError = Error & { name: 'NpcUpdateError' };
export const npcUpdateError = (id: string, cause?: unknown): NpcUpdateError => {
  const error = new Error(
    `Failed to update NPC ${id}: ${String(cause)}`,
  ) as NpcUpdateError;
  error.name = 'NpcUpdateError';
  return error;
};

export type NpcDeleteError = Error & { name: 'NpcDeleteError' };
export const npcDeleteError = (id: string, cause?: unknown): NpcDeleteError => {
  const error = new Error(
    `Failed to delete NPC ${id}: ${String(cause)}`,
  ) as NpcDeleteError;
  error.name = 'NpcDeleteError';
  return error;
};
