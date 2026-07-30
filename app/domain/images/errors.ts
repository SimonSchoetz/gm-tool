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
