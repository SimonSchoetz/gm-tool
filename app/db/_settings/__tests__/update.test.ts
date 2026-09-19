// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { BackgroundSettings } from '../schema';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('updateSetting', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores the value so the next read returns it', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await updateSetting('background', { animation_enabled: false });

    expect(await getSetting('background')).toEqual({
      animation_enabled: false,
    });
  });

  it('rejects a value that fails the schema and leaves the stored value unchanged', async () => {
    const { updateSetting } = await import('../update');
    const { getSetting } = await import('../get');

    await expect(
      updateSetting('background', {
        animation_enabled: 'yes',
      } as unknown as BackgroundSettings),
    ).rejects.toThrow();

    expect(await getSetting('background')).toEqual({
      animation_enabled: true,
    });
  });
});
