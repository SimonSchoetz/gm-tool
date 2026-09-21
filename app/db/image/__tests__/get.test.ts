// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const SEEDED_AT = '2026-01-10T09:00:00.000Z';

describe('get', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the image whose id is passed when several are stored, and null for an id with no image', async () => {
    const { get } = await import('../get');
    const { seedImage } = await import('@db/__tests__/support/image-fixtures');
    for (const [id, extension] of [
      ['first-image', 'png'],
      ['second-image', 'webp'],
    ]) {
      await seedImage(id, extension, SEEDED_AT);
    }

    expect(await get('second-image')).toEqual({
      id: 'second-image',
      file_extension: 'webp',
      original_filename: null,
      file_size: null,
      frame_x: null,
      frame_y: null,
      frame_zoom: null,
      created_at: SEEDED_AT,
      updated_at: SEEDED_AT,
    });
    expect(await get('missing-image')).toBeNull();
  });
});
