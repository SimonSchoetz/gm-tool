// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VersioningData } from '../schema';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('versioning', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the seeded value with no snoozed version', async () => {
    const { getVersioning } = await import('../versioning');

    expect(await getVersioning()).toEqual({ snoozed_update_version: null });
  });

  it('returns null when the versioning row is missing', async () => {
    const { getVersioning } = await import('../versioning');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute("DELETE FROM _system WHERE id = 'versioning'");

    expect(await getVersioning()).toBeNull();
  });

  it('rejects a stored value that fails the schema', async () => {
    const { getVersioning } = await import('../versioning');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute(
      "UPDATE _system SET value = '{\"wrong_field\":true}' WHERE id = 'versioning'",
    );

    await expect(getVersioning()).rejects.toThrow();
  });

  it('returns the snoozed version that updateVersioning stored and rejects an invalid one, leaving the stored value unchanged', async () => {
    const { getVersioning, updateVersioning } = await import('../versioning');

    await updateVersioning({ snoozed_update_version: '1.2.3' });
    expect(await getVersioning()).toEqual({ snoozed_update_version: '1.2.3' });

    await expect(
      updateVersioning({
        snoozed_update_version: 1,
      } as unknown as VersioningData),
    ).rejects.toThrow();
    expect(await getVersioning()).toEqual({ snoozed_update_version: '1.2.3' });
  });
});
