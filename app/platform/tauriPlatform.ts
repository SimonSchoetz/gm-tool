import { invoke, Channel, convertFileSrc } from '@tauri-apps/api/core';
import { listen, type EventCallback } from '@tauri-apps/api/event';
import { getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/plugin-dialog';
import { openUrl } from '@tauri-apps/plugin-opener';
import Database from '@tauri-apps/plugin-sql';
import type { Platform } from './types';

// Every member is an arrow that reads its package export only when invoked: a test's vi.mock factory for one of these packages may return `invoke` alone, and a read of an export the factory left out throws at the read, so a shorthand property here would fail this module's load under that mock.
export const tauriPlatform: Platform = {
  invoke: <T>(command: string, args?: Record<string, unknown>) =>
    invoke<T>(command, args),
  loadDatabase: (databaseFile) => Database.load(`sqlite:${databaseFile}`),
  listen: <T>(event: string, handler: EventCallback<T>) =>
    listen<T>(event, handler),
  createIpcChannel: <T>(onmessage: (message: T) => void) =>
    new Channel<T>(onmessage),
  getVersion: () => getVersion(),
  convertFileSrc: (filePath) => convertFileSrc(filePath),
  openUrl: (url) => openUrl(url),
  // DialogFilter.extensions is a mutable string[], so the readonly list is copied.
  pickFile: ({ extensions }) =>
    open({
      multiple: false,
      filters: [{ name: 'Allowed Files', extensions: [...extensions] }],
    }),
};
