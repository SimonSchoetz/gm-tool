export type SyncHandshakeError = Error & { name: 'SyncHandshakeError' };
export const syncHandshakeError = (cause?: unknown): SyncHandshakeError => {
  const error = new Error(
    `Sync handshake failed: ${String(cause)}`,
  ) as SyncHandshakeError;
  error.name = 'SyncHandshakeError';
  return error;
};

export type SyncBatchBuildError = Error & { name: 'SyncBatchBuildError' };
export const syncBatchBuildError = (cause?: unknown): SyncBatchBuildError => {
  const error = new Error(
    `Failed to build sync batch: ${String(cause)}`,
  ) as SyncBatchBuildError;
  error.name = 'SyncBatchBuildError';
  return error;
};

export type SyncApplyError = Error & { name: 'SyncApplyError' };
export const syncApplyError = (cause?: unknown): SyncApplyError => {
  const error = new Error(
    `Failed to apply sync batch: ${String(cause)}`,
  ) as SyncApplyError;
  error.name = 'SyncApplyError';
  return error;
};

export type SyncPushError = Error & { name: 'SyncPushError' };
export const syncPushError = (cause?: unknown): SyncPushError => {
  const error = new Error(
    `Failed to push sync changes: ${String(cause)}`,
  ) as SyncPushError;
  error.name = 'SyncPushError';
  return error;
};

export type ImageTransferError = Error & { name: 'ImageTransferError' };
export const imageTransferError = (cause?: unknown): ImageTransferError => {
  const error = new Error(
    `Image file transfer failed: ${String(cause)}`,
  ) as ImageTransferError;
  error.name = 'ImageTransferError';
  return error;
};
