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

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';
const SOURCE_ID = 'source-image';

const readImage = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Image[]>('SELECT * FROM images WHERE id = $1', [
    id,
  ]);
  return rows[0];
};

// The source's size differs from what the save command reports, and every frame value is set, so a copy that takes the size from a save command or drops the framing shows.
const seedSourceImage = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO images (id, file_extension, original_filename, file_size, frame_x, frame_y, frame_zoom, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)',
    [SOURCE_ID, 'png', 'src.png', 999, 0.25, 0.5, 1.5, T1],
  );
};

describe('duplicate', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockImplementation(answerCommand);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the row under a fresh id with new timestamps and copies the file bytes to that id', async () => {
    const { duplicate } = await import('../duplicate');
    await seedSourceImage();
    vi.setSystemTime(new Date(T2));

    const duplicateId = await duplicate(SOURCE_ID);

    expect(duplicateId).not.toBe(SOURCE_ID);
    expect(await readImage(duplicateId)).toEqual({
      id: duplicateId,
      file_extension: 'png',
      original_filename: 'src.png',
      file_size: 999,
      frame_x: 0.25,
      frame_y: 0.5,
      frame_zoom: 1.5,
      created_at: T2,
      updated_at: T2,
    });
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenNthCalledWith(1, 'read_image_bytes', {
      id: SOURCE_ID,
      extension: 'png',
    });
    expect(invoke).toHaveBeenNthCalledWith(2, 'save_image_bytes', {
      id: duplicateId,
      extension: 'png',
      dataBase64: 'aW1hZ2U=',
    });
  });

  it('leaves the source row unchanged, timestamps included', async () => {
    const { duplicate } = await import('../duplicate');
    await seedSourceImage();
    const before = await readImage(SOURCE_ID);
    vi.setSystemTime(new Date(T2));

    await duplicate(SOURCE_ID);

    expect(await readImage(SOURCE_ID)).toEqual(before);
  });

  it('rejects an unknown source id', async () => {
    const { duplicate } = await import('../duplicate');

    await expect(duplicate('missing-image')).rejects.toThrow(
      'Image not found: missing-image',
    );
  });
});
