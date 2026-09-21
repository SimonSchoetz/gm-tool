// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

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

const OLD_ID = 'old-image';

const commandsInvoked = () => invoke.mock.calls.map(([command]) => command);

// The old image is a plain row: the only invoke calls a test sees are the ones `replace` makes.
const seedOldImage = async () => {
  const { seedImage } = await import('@db/__tests__/support/image-fixtures');
  await seedImage(OLD_ID, 'png', '2026-01-10T09:00:00.000Z');
};

describe('replace', () => {
  beforeEach(async () => {
    vi.resetModules();
    const { answerImageCommand } =
      await import('@db/__tests__/support/image-fixtures');
    invoke.mockImplementation(answerImageCommand);
  });

  it('saves the new file first, then deletes the old image, and returns the id of the new row', async () => {
    const { replace } = await import('../replace');
    const { readImages } = await import('@db/__tests__/support/image-fixtures');
    await seedOldImage();

    const newId = await replace(OLD_ID, { filePath: '/pics/new.png' });

    expect(newId).not.toBe(OLD_ID);
    expect((await readImages()).map((image) => image.id)).toEqual([newId]);
    expect(commandsInvoked()).toEqual(['save_image', 'delete_image']);
  });

  it('keeps the old image and deletes no file when the new extension is unsupported', async () => {
    const { replace } = await import('../replace');
    const { readImages } = await import('@db/__tests__/support/image-fixtures');
    await seedOldImage();

    await expect(
      replace(OLD_ID, { filePath: '/docs/notes.pdf' }),
    ).rejects.toThrow('Unsupported file extension: pdf');

    expect((await readImages()).map((image) => image.id)).toEqual([OLD_ID]);
    expect(commandsInvoked()).not.toContain('delete_image');
  });

  it('keeps the old image and deletes no file when the new file cannot be saved', async () => {
    const { replace } = await import('../replace');
    const { readImages } = await import('@db/__tests__/support/image-fixtures');
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
    const { answerImageCommand, readImages } =
      await import('@db/__tests__/support/image-fixtures');
    await seedOldImage();
    invoke.mockImplementation((command) =>
      command === 'delete_image'
        ? Promise.reject(new Error('delete failed'))
        : answerImageCommand(command),
    );

    await expect(
      replace(OLD_ID, { filePath: '/pics/new.png' }),
    ).rejects.toThrow('delete failed');

    expect(
      (await readImages()).map((image) => image.original_filename),
    ).toEqual(['new.png']);
  });
});
