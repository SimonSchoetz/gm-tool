// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getSetting', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the seeded background setting parsed through its schema', async () => {
    const { getSetting } = await import('../get');

    expect(await getSetting('background')).toEqual({
      animation_enabled: true,
    });
  });

  it('returns null when the setting row is missing', async () => {
    const { getSetting } = await import('../get');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute("DELETE FROM _settings WHERE id = 'background'");

    expect(await getSetting('background')).toBeNull();
  });

  it('rejects a stored value that fails the schema', async () => {
    const { getSetting } = await import('../get');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute(
      'UPDATE _settings SET value = \'{"animation_enabled":"yes"}\' WHERE id = \'background\'',
    );

    await expect(getSetting('background')).rejects.toThrow();
  });
});
