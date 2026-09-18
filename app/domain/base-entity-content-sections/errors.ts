export type BaseEntityContentSectionLoadError = Error & {
  name: 'BaseEntityContentSectionLoadError';
};
export const baseEntityContentSectionLoadError = (
  cause?: unknown,
): BaseEntityContentSectionLoadError => {
  const error = new Error(
    `Failed to load base entity content sections: ${String(cause)}`,
  ) as BaseEntityContentSectionLoadError;
  error.name = 'BaseEntityContentSectionLoadError';
  return error;
};

export type BaseEntityContentSectionCreateError = Error & {
  name: 'BaseEntityContentSectionCreateError';
};
export const baseEntityContentSectionCreateError = (
  cause?: unknown,
): BaseEntityContentSectionCreateError => {
  const error = new Error(
    `Failed to create base entity content section: ${String(cause)}`,
  ) as BaseEntityContentSectionCreateError;
  error.name = 'BaseEntityContentSectionCreateError';
  return error;
};

export type BaseEntityContentSectionUpdateError = Error & {
  name: 'BaseEntityContentSectionUpdateError';
};
export const baseEntityContentSectionUpdateError = (
  id: string,
  cause?: unknown,
): BaseEntityContentSectionUpdateError => {
  const error = new Error(
    `Failed to update base entity content section ${id}: ${String(cause)}`,
  ) as BaseEntityContentSectionUpdateError;
  error.name = 'BaseEntityContentSectionUpdateError';
  return error;
};

export type BaseEntityContentSectionDeleteError = Error & {
  name: 'BaseEntityContentSectionDeleteError';
};
export const baseEntityContentSectionDeleteError = (
  id: string,
  cause?: unknown,
): BaseEntityContentSectionDeleteError => {
  const error = new Error(
    `Failed to delete base entity content section ${id}: ${String(cause)}`,
  ) as BaseEntityContentSectionDeleteError;
  error.name = 'BaseEntityContentSectionDeleteError';
  return error;
};

export type BaseEntityContentSectionReorderError = Error & {
  name: 'BaseEntityContentSectionReorderError';
};
export const baseEntityContentSectionReorderError = (
  cause?: unknown,
): BaseEntityContentSectionReorderError => {
  const error = new Error(
    `Failed to reorder base entity content sections: ${String(cause)}`,
  ) as BaseEntityContentSectionReorderError;
  error.name = 'BaseEntityContentSectionReorderError';
  return error;
};
