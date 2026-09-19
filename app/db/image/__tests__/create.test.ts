// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Image } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const answerCommand = (command: string): Promise<unknown> => {
  switch (command) {
    case 'save_image':
      return Promise.resolve(1234);
    case 'read_image_bytes':
      return Promise.resolve('aW1hZ2U=');
    case 'save_image_bytes':
    case 'delete_image':
      return Promise.resolve(undefined);
    default:
      return Promise.reject(new Error(`Unexpected command: ${command}`));
  }
};

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readImages = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<Image[]>('SELECT * FROM images');
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockImplementation(answerCommand);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores an upper-case extension in lower case with the file name and the saved size, and saves the file under the id of its row', async () => {
    const { create } = await import('../create');

    const id = await create({ filePath: '/pics/Photo.JPG' });

    expect(await readImages()).toEqual([
      {
        id,
        file_extension: 'jpg',
        original_filename: 'Photo.JPG',
        file_size: 1234,
        frame_x: null,
        frame_y: null,
        frame_zoom: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith('save_image', {
      sourcePath: '/pics/Photo.JPG',
      id,
      extension: 'jpg',
    });
  });

  it('rejects an unsupported extension before saving any file and stores no row', async () => {
    const { create } = await import('../create');

    await expect(create({ filePath: '/docs/notes.pdf' })).rejects.toThrow(
      'Unsupported file extension: pdf',
    );

    expect(invoke).not.toHaveBeenCalled();
    expect(await readImages()).toEqual([]);
  });

  it('stores no row when the file cannot be saved', async () => {
    const { create } = await import('../create');
    invoke.mockImplementation(() => Promise.reject(new Error('disk full')));

    await expect(create({ filePath: '/pics/Photo.png' })).rejects.toThrow(
      'disk full',
    );

    expect(await readImages()).toEqual([]);
  });
});
