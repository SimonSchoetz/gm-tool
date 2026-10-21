import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as app from '@tauri-apps/api/app';
import type * as core from '@tauri-apps/api/core';
import type * as event from '@tauri-apps/api/event';
import type * as dialog from '@tauri-apps/plugin-dialog';
import type * as opener from '@tauri-apps/plugin-opener';
import type Database from '@tauri-apps/plugin-sql';
import { tauriPlatform } from '../tauriPlatform';

const open = vi.hoisted(() => vi.fn<typeof dialog.open>());
const load = vi.hoisted(() => vi.fn<typeof Database.load>());
const listen = vi.hoisted(() => vi.fn<typeof event.listen>());
const getVersion = vi.hoisted(() => vi.fn<typeof app.getVersion>());
const convertFileSrc = vi.hoisted(() => vi.fn<typeof core.convertFileSrc>());
const openUrl = vi.hoisted(() => vi.fn<typeof opener.openUrl>());
// Records what each Channel is constructed with, standing in for the IPC channel class.
const Channel = vi.hoisted(
  () =>
    class {
      readonly onmessage: (message: unknown) => void;
      constructor(onmessage: (message: unknown) => void) {
        this.onmessage = onmessage;
      }
    },
);

vi.mock('@tauri-apps/plugin-dialog', () => ({ open }));
vi.mock('@tauri-apps/plugin-sql', () => ({ default: { load } }));
vi.mock('@tauri-apps/api/event', () => ({ listen }));
vi.mock('@tauri-apps/api/app', () => ({ getVersion }));
vi.mock('@tauri-apps/api/core', () => ({ Channel, convertFileSrc }));
vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl }));

beforeEach(() => {
  for (const mock of [
    open,
    load,
    listen,
    getVersion,
    convertFileSrc,
    openUrl,
  ]) {
    mock.mockReset();
  }
});

describe('tauriPlatform.pickFile', () => {
  it('asks the dialog for a single file under the Allowed Files filter with a copy of the extensions, and resolves its answer', async () => {
    const extensions: readonly string[] = ['png', 'jpg'];
    open.mockResolvedValue('/picked/image.png');

    await expect(tauriPlatform.pickFile({ extensions })).resolves.toBe(
      '/picked/image.png',
    );

    expect(open).toHaveBeenCalledWith({
      multiple: false,
      filters: [{ name: 'Allowed Files', extensions: ['png', 'jpg'] }],
    });
  });
});

describe('tauriPlatform.loadDatabase', () => {
  it('loads the sqlite: URL of the given file', async () => {
    const database = { path: 'sqlite:gm_tool.db' } as Database;
    load.mockResolvedValue(database);

    await expect(tauriPlatform.loadDatabase('gm_tool.db')).resolves.toBe(
      database,
    );

    expect(load).toHaveBeenCalledWith('sqlite:gm_tool.db');
  });
});

describe('tauriPlatform forwarding members', () => {
  it('listen registers the handler for the event and resolves the unlisten function', async () => {
    const handler = vi.fn();
    const unlisten = vi.fn();
    listen.mockResolvedValue(unlisten);

    await expect(tauriPlatform.listen('sync-changed', handler)).resolves.toBe(
      unlisten,
    );
    expect(listen).toHaveBeenCalledWith('sync-changed', handler);
  });

  it('createIpcChannel builds a channel delivering to the given handler', () => {
    const onmessage = vi.fn();

    expect(tauriPlatform.createIpcChannel(onmessage).onmessage).toBe(onmessage);
  });

  it('getVersion resolves the app version', async () => {
    getVersion.mockResolvedValue('1.2.3');

    await expect(tauriPlatform.getVersion()).resolves.toBe('1.2.3');
  });

  it('convertFileSrc answers the asset URL of the given path', () => {
    convertFileSrc.mockReturnValue('asset://localhost/img.png');

    expect(tauriPlatform.convertFileSrc('/data/img.png')).toBe(
      'asset://localhost/img.png',
    );
    expect(convertFileSrc).toHaveBeenCalledWith('/data/img.png');
  });

  it('openUrl opens the given URL', async () => {
    openUrl.mockResolvedValue(undefined);

    await tauriPlatform.openUrl('https://example.test/');

    expect(openUrl).toHaveBeenCalledWith('https://example.test/');
  });
});
