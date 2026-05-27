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
