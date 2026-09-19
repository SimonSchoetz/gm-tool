// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
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

const OLD_ID = 'old-image';

const commandsInvoked = () => invoke.mock.calls.map(([command]) => command);

const readImages = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<Image[]>('SELECT * FROM images');
};

// The old image is a plain row: the only invoke calls a test sees are the ones `replace` makes.
const seedOldImage = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO images (id, file_extension, created_at, updated_at) VALUES ($1, $2, $3, $3)',
    [OLD_ID, 'png', '2026-01-10T09:00:00.000Z'],
  );
};

describe('replace', () => {
  beforeEach(() => {
    vi.resetModules();
    invoke.mockImplementation(answerCommand);
  });

  it('saves the new file first, then deletes the old image, and returns the id of the new row', async () => {
    const { replace } = await import('../replace');
    await seedOldImage();

    const newId = await replace(OLD_ID, { filePath: '/pics/new.png' });

    expect(newId).not.toBe(OLD_ID);
    expect((await readImages()).map((image) => image.id)).toEqual([newId]);
    expect(commandsInvoked()).toEqual(['save_image', 'delete_image']);
  });

  it('keeps the old image and deletes no file when the new extension is unsupported', async () => {
    const { replace } = await import('../replace');
    await seedOldImage();

    await expect(
      replace(OLD_ID, { filePath: '/docs/notes.pdf' }),
    ).rejects.toThrow('Unsupported file extension: pdf');

    expect((await readImages()).map((image) => image.id)).toEqual([OLD_ID]);
    expect(commandsInvoked()).not.toContain('delete_image');
  });

  it('keeps the old image and deletes no file when the new file cannot be saved', async () => {
    const { replace } = await import('../replace');
    await seedOldImage();
    invoke.mockImplementation(() => Promise.reject(new Error('disk full')));

    await expect(
      replace(OLD_ID, { filePath: '/pics/new.png' }),
    ).rejects.toThrow('disk full');

    expect((await readImages()).map((image) => image.id)).toEqual([OLD_ID]);
    expect(commandsInvoked()).not.toContain('delete_image');
  });

  it('rejects with the deletion error and keeps the new row when the old file cannot be deleted', async () => {
    const { replace } = await import('../replace');
    await seedOldImage();
    invoke.mockImplementation((command) =>
      command === 'delete_image'
        ? Promise.reject(new Error('delete failed'))
        : answerCommand(command),
    );

    await expect(
      replace(OLD_ID, { filePath: '/pics/new.png' }),
    ).rejects.toThrow('delete failed');

    expect(
      (await readImages()).map((image) => image.original_filename),
    ).toEqual(['new.png']);
  });
});
