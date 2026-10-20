import type Database from '@tauri-apps/plugin-sql';
import type { EventCallback, UnlistenFn } from '@tauri-apps/api/event';

export type IpcChannel<T> = { onmessage: (message: T) => void };

export type Platform = {
  invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>;
  loadDatabase: (databaseFile: string) => Promise<Database>;
  listen: <T>(event: string, handler: EventCallback<T>) => Promise<UnlistenFn>;
  createIpcChannel: <T>(onmessage: (message: T) => void) => IpcChannel<T>;
  getVersion: () => Promise<string>;
  convertFileSrc: (filePath: string) => string;
  openUrl: (url: string) => Promise<void>;
  pickFile: (options: {
    extensions: readonly string[];
  }) => Promise<string | null>;
};
