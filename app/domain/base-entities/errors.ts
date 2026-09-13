import { entityTypeLabel, type BaseEntityType } from '../entities';

export type BaseEntityNotFoundError = Error & {
  name: 'BaseEntityNotFoundError';
};
export const baseEntityNotFoundError = (
  entityType: BaseEntityType,
  id: string,
): BaseEntityNotFoundError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `${label} with id ${id} not found`,
  ) as BaseEntityNotFoundError;
  error.name = 'BaseEntityNotFoundError';
  return error;
};

export type BaseEntityLoadError = Error & { name: 'BaseEntityLoadError' };
export const baseEntityLoadError = (
  entityType: BaseEntityType,
  cause?: unknown,
): BaseEntityLoadError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `Failed to load ${label}s: ${String(cause)}`,
  ) as BaseEntityLoadError;
  error.name = 'BaseEntityLoadError';
  return error;
};

export type BaseEntityCreateError = Error & { name: 'BaseEntityCreateError' };
export const baseEntityCreateError = (
  entityType: BaseEntityType,
  cause?: unknown,
): BaseEntityCreateError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `Failed to create ${label}: ${String(cause)}`,
  ) as BaseEntityCreateError;
  error.name = 'BaseEntityCreateError';
  return error;
};

export type BaseEntityUpdateError = Error & { name: 'BaseEntityUpdateError' };
export const baseEntityUpdateError = (
  entityType: BaseEntityType,
  id: string,
  cause?: unknown,
): BaseEntityUpdateError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `Failed to update ${label} ${id}: ${String(cause)}`,
  ) as BaseEntityUpdateError;
  error.name = 'BaseEntityUpdateError';
  return error;
};

export type BaseEntityDeleteError = Error & { name: 'BaseEntityDeleteError' };
export const baseEntityDeleteError = (
  entityType: BaseEntityType,
  id: string,
  cause?: unknown,
): BaseEntityDeleteError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `Failed to delete ${label} ${id}: ${String(cause)}`,
  ) as BaseEntityDeleteError;
  error.name = 'BaseEntityDeleteError';
  return error;
};

export type BaseEntityDuplicateError = Error & {
  name: 'BaseEntityDuplicateError';
};
export const baseEntityDuplicateError = (
  entityType: BaseEntityType,
  id: string,
  cause?: unknown,
): BaseEntityDuplicateError => {
  const label = entityTypeLabel(entityType);
  const error = new Error(
    `Failed to duplicate ${label} ${id}: ${String(cause)}`,
  ) as BaseEntityDuplicateError;
  error.name = 'BaseEntityDuplicateError';
  return error;
};
