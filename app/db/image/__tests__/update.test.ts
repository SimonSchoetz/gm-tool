// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Image } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const IMAGE_ID = 'image-1';

const readImage = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Image[]>('SELECT * FROM images WHERE id = $1', [
    IMAGE_ID,
  ]);
  return rows[0];
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes each frame value to its own column and clears all three with null', async () => {
    const { update } = await import('../update');
    const { seedImage } = await import('@db/__tests__/support/image-fixtures');
    await seedImage(IMAGE_ID, 'png', '2026-01-10T09:00:00.000Z');

    await update(IMAGE_ID, { frame_x: 0.1, frame_y: 0.2, frame_zoom: 1.5 });
    expect(await readImage()).toMatchObject({
      frame_x: 0.1,
      frame_y: 0.2,
      frame_zoom: 1.5,
    });

    await update(IMAGE_ID, { frame_x: null, frame_y: null, frame_zoom: null });
    expect(await readImage()).toMatchObject({
      frame_x: null,
      frame_y: null,
      frame_zoom: null,
    });
  });
});
