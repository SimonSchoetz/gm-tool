// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { CreateImageInput } from '../types';

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

const NEW_ID = 'image-new';
const CREATED_AT = '2026-01-10T09:00:00.000Z';

describe('create', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { answerImageCommand } =
      await import('@db/__tests__/support/image-fixtures');
    invoke.mockImplementation(answerImageCommand);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores an upper-case extension in lower case with the file name and the saved size, and saves the file under the id the caller gave, which it returns', async () => {
    const { create } = await import('../create');
    const { readImages } = await import('@db/__tests__/support/image-fixtures');

    const id = await create({ filePath: '/pics/Photo.JPG' }, NEW_ID);

    expect(id).toBe(NEW_ID);

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
    const { readImages } = await import('@db/__tests__/support/image-fixtures');

    await expect(
      create({ filePath: '/docs/notes.pdf' }, NEW_ID),
    ).rejects.toThrow(/^Unsupported file extension: pdf$/);

    expect(invoke).not.toHaveBeenCalled();
    expect(await readImages()).toEqual([]);
  });

  it('stores no row when the file cannot be saved', async () => {
    const { create } = await import('../create');
    const { readImages } = await import('@db/__tests__/support/image-fixtures');
    invoke.mockImplementation(() => Promise.reject(new Error('disk full')));

    await expect(
      create({ filePath: '/pics/Photo.png' }, NEW_ID),
    ).rejects.toThrow(/^disk full$/);

    expect(await readImages()).toEqual([]);
  });

  it('rejects a file path that is not a string before saving anything', async () => {
    const { create } = await import('../create');
    invoke.mockClear();

    await expect(
      create({ filePath: 42 } as unknown as CreateImageInput, NEW_ID),
    ).rejects.toThrow(/^filePath must be a string$/);

    expect(invoke).not.toHaveBeenCalled();
  });
});
