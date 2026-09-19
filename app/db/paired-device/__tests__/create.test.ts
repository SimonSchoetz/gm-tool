// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { PairedDevice } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';
const DEVICE_A = 'a'.repeat(64);
const DEVICE_B = 'b'.repeat(64);

const readDevices = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<PairedDevice[]>(
    'SELECT * FROM paired_devices ORDER BY rowid',
  );
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores the given id with the given name, or with no name when it is null', async () => {
    const { create } = await import('../create');

    expect(await create({ id: DEVICE_A, name: 'Laptop' })).toBe(DEVICE_A);
    expect(await create({ id: DEVICE_B, name: null })).toBe(DEVICE_B);

    expect(await readDevices()).toEqual([
      {
        id: DEVICE_A,
        name: 'Laptop',
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
      {
        id: DEVICE_B,
        name: null,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('rejects an id that is not 64 lowercase hex characters and stores nothing', async () => {
    const { create } = await import('../create');

    await expect(create({ id: 'not-hex', name: null })).rejects.toThrow();

    expect(await readDevices()).toEqual([]);
  });

  it('rejects creating the same id twice', async () => {
    const { create } = await import('../create');
    await create({ id: DEVICE_A, name: 'Laptop' });

    await expect(create({ id: DEVICE_A, name: 'Again' })).rejects.toThrow(
      'UNIQUE constraint failed',
    );

    expect(await readDevices()).toHaveLength(1);
  });
});
