type SyncHandshakeError = Error & { name: 'SyncHandshakeError' };
export const syncHandshakeError = (cause?: unknown): SyncHandshakeError => {
  const error = new Error(
    `Sync handshake failed: ${String(cause)}`,
  ) as SyncHandshakeError;
  error.name = 'SyncHandshakeError';
  return error;
};

type SyncApplyError = Error & { name: 'SyncApplyError' };
export const syncApplyError = (cause?: unknown): SyncApplyError => {
  const error = new Error(
    `Failed to apply sync batch: ${String(cause)}`,
  ) as SyncApplyError;
  error.name = 'SyncApplyError';
  return error;
};

type SyncPushError = Error & { name: 'SyncPushError' };
export const syncPushError = (cause?: unknown): SyncPushError => {
  const error = new Error(
    `Failed to push sync changes: ${String(cause)}`,
  ) as SyncPushError;
  error.name = 'SyncPushError';
  return error;
};

type SyncChangeRecordError = Error & { name: 'SyncChangeRecordError' };
export const syncChangeRecordError = (
  cause?: unknown,
): SyncChangeRecordError => {
  const error = new Error(
    `Malformed sync change record: ${String(cause)}`,
  ) as SyncChangeRecordError;
  error.name = 'SyncChangeRecordError';
  return error;
};
