export type UpdateCheckErrorReason = 'network' | 'server';

export type UpdateCheckError = Error & {
  name: 'UpdateCheckError';
  reason: UpdateCheckErrorReason;
};

export const updateCheckError = (
  cause?: unknown,
  reason: UpdateCheckErrorReason = 'server',
): UpdateCheckError => {
  const error = new Error(
    `Failed to check for updates: ${String(cause)}`,
  ) as UpdateCheckError;
  error.name = 'UpdateCheckError';
  error.reason = reason;
  return error;
};

export type UpdateDownloadError = Error & { name: 'UpdateDownloadError' };
export const updateDownloadError = (cause?: unknown): UpdateDownloadError => {
  const error = new Error(
    `Failed to download update: ${String(cause)}`,
  ) as UpdateDownloadError;
  error.name = 'UpdateDownloadError';
  return error;
};

export type UpdateInstallAndRelaunchError = Error & {
  name: 'UpdateInstallAndRelaunchError';
};
export const updateInstallAndRelaunchError = (
  cause?: unknown,
): UpdateInstallAndRelaunchError => {
  const error = new Error(
    `Failed to install update: ${String(cause)}`,
  ) as UpdateInstallAndRelaunchError;
  error.name = 'UpdateInstallAndRelaunchError';
  return error;
};
