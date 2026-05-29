import { invoke } from '@tauri-apps/api/core';
import { updateCheckError, updateInstallError } from '@domain';

export const checkUpdate = async (): Promise<string | null> => {
  try {
    return await invoke<string | null>('check_update');
  } catch (cause) {
    throw updateCheckError(cause);
  }
};

export const installUpdate = async (): Promise<void> => {
  try {
    await invoke('install_update');
  } catch (cause) {
    throw updateInstallError(cause);
  }
};
