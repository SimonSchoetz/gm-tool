export type UpdateCheckError = Error & { name: 'UpdateCheckError' };
export const updateCheckError = (cause?: unknown): UpdateCheckError => {
  const error = new Error(
    `Failed to check for updates: ${String(cause)}`,
  ) as UpdateCheckError;
  error.name = 'UpdateCheckError';
  return error;
};

export type UpdateInstallError = Error & { name: 'UpdateInstallError' };
export const updateInstallError = (cause?: unknown): UpdateInstallError => {
  const error = new Error(
    `Failed to install update: ${String(cause)}`,
  ) as UpdateInstallError;
  error.name = 'UpdateInstallError';
  return error;
};
