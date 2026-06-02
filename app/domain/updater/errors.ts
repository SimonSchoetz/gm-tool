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

export type UpdateInstallError = Error & { name: 'UpdateInstallError' };
export const updateInstallError = (cause?: unknown): UpdateInstallError => {
  const error = new Error(
    `Failed to install update: ${String(cause)}`,
  ) as UpdateInstallError;
  error.name = 'UpdateInstallError';
  return error;
};
