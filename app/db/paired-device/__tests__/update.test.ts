// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const DEVICE_ID = 'a'.repeat(64);

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes a new name, and clears the name when it is set to null', async () => {
    const { create } = await import('../create');
    const { update } = await import('../update');
    const { get } = await import('../get');
    await create({ id: DEVICE_ID, name: 'Old name' });

    await update(DEVICE_ID, { name: 'New name' });
    expect(await get(DEVICE_ID)).toMatchObject({ name: 'New name' });

    await update(DEVICE_ID, { name: null });
    expect(await get(DEVICE_ID)).toMatchObject({ name: null });
  });
});
