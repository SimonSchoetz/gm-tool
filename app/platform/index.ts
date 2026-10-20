import { tauriPlatform } from './tauriPlatform';
import { webPlatform } from './webPlatform';
import type { Platform } from './types';

const platform: Platform =
  import.meta.env.MODE === 'web' ? webPlatform : tauriPlatform;

export const {
  invoke,
  loadDatabase,
  listen,
  createIpcChannel,
  getVersion,
  convertFileSrc,
  openUrl,
  pickFile,
} = platform;
export type { IpcChannel } from './types';
