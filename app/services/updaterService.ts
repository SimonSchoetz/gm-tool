import { invoke } from '@tauri-apps/api/core';
import {
  updateCheckError,
  updateInstallError,
  type UpdateCheckErrorReason,
} from '@domain';

const categorizeCheckError = (cause: unknown): UpdateCheckErrorReason => {
  const message = String(cause).toLowerCase();
  if (
    message.includes('os error') ||
    message.includes('dns') ||
    message.includes('connection refused') ||
    message.includes('network')
  ) {
    return 'network';
  }
  return 'server';
};

export const checkUpdate = async (): Promise<string | null> => {
  try {
    return await invoke<string | null>('check_update');
  } catch (cause) {
    throw updateCheckError(cause, categorizeCheckError(cause));
  }
};

export const installUpdate = async (): Promise<void> => {
  try {
    await invoke('install_update');
  } catch (cause) {
    throw updateInstallError(cause);
  }
};
