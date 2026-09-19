// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const DEVICE_ID = 'a'.repeat(64);

const writeDeviceValue = async (value: string | null) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
    ['device', value],
  );
};

describe('device', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('has no device on a fresh database', async () => {
    const { getDevice } = await import('../device');

    expect(await getDevice()).toBeNull();
  });

  it('reads a device row whose value is SQL NULL as no device', async () => {
    const { getDevice } = await import('../device');
    await writeDeviceValue(null);

    expect(await getDevice()).toBeNull();
  });

  it('returns the device that updateDevice stored', async () => {
    const { getDevice, updateDevice } = await import('../device');

    await updateDevice({ id: DEVICE_ID, name: 'My laptop' });

    expect(await getDevice()).toEqual({ id: DEVICE_ID, name: 'My laptop' });
  });

  it('rejects an id that is not hex and stores no device', async () => {
    const { getDevice, updateDevice } = await import('../device');

    await expect(updateDevice({ id: 'not-hex', name: null })).rejects.toThrow();

    expect(await getDevice()).toBeNull();
  });

  it('rejects a stored device that fails the schema', async () => {
    const { getDevice } = await import('../device');
    await writeDeviceValue('{"id":"not-hex","name":null}');

    await expect(getDevice()).rejects.toThrow();
  });
});
