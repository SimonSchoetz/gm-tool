export type ImageNotFoundError = Error & { name: 'ImageNotFoundError' };
export const imageNotFoundError = (id: string): ImageNotFoundError => {
  const error = new Error(
    `Image with id ${id} not found`,
  ) as ImageNotFoundError;
  error.name = 'ImageNotFoundError';
  return error;
};

export type ImageLoadError = Error & { name: 'ImageLoadError' };
export const imageLoadError = (cause?: unknown): ImageLoadError => {
  const error = new Error(
    `Failed to load Image: ${String(cause)}`,
  ) as ImageLoadError;
  error.name = 'ImageLoadError';
  return error;
};

export type ImageCreateError = Error & { name: 'ImageCreateError' };
export const imageCreateError = (cause?: unknown): ImageCreateError => {
  const error = new Error(
    `Failed to create Image: ${String(cause)}`,
  ) as ImageCreateError;
  error.name = 'ImageCreateError';
  return error;
};

export type ImageDeleteError = Error & { name: 'ImageDeleteError' };
export const imageDeleteError = (
  id: string,
  cause?: unknown,
): ImageDeleteError => {
  const error = new Error(
    `Failed to delete Image ${id}: ${String(cause)}`,
  ) as ImageDeleteError;
  error.name = 'ImageDeleteError';
  return error;
};

export type ImageReplaceError = Error & { name: 'ImageReplaceError' };
export const imageReplaceError = (
  id: string,
  cause?: unknown,
): ImageReplaceError => {
  const error = new Error(
    `Failed to replace Image ${id}: ${String(cause)}`,
  ) as ImageReplaceError;
  error.name = 'ImageReplaceError';
  return error;
};

export type ImageDuplicateError = Error & { name: 'ImageDuplicateError' };
export const imageDuplicateError = (cause?: unknown): ImageDuplicateError => {
  const error = new Error(
    `Failed to duplicate image: ${String(cause)}`,
  ) as ImageDuplicateError;
  error.name = 'ImageDuplicateError';
  return error;
};

export type ImageUpdateFrameError = Error & { name: 'ImageUpdateFrameError' };
export const imageUpdateFrameError = (
  cause?: unknown,
): ImageUpdateFrameError => {
  const error = new Error(
    `Failed to update image frame: ${String(cause)}`,
  ) as ImageUpdateFrameError;
  error.name = 'ImageUpdateFrameError';
  return error;
};
