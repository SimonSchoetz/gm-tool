import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as dialog from '@tauri-apps/plugin-dialog';
import type Database from '@tauri-apps/plugin-sql';
import { tauriPlatform } from '../tauriPlatform';

const open = vi.hoisted(() => vi.fn<typeof dialog.open>());
const load = vi.hoisted(() => vi.fn<typeof Database.load>());

vi.mock('@tauri-apps/plugin-dialog', () => ({ open }));
vi.mock('@tauri-apps/plugin-sql', () => ({ default: { load } }));

beforeEach(() => {
  open.mockReset();
  load.mockReset();
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
    const [options] = open.mock.calls[0];
    expect(options?.filters?.[0]?.extensions).not.toBe(extensions);
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
