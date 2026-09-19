// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const REMOVED_DEVICE = 'a'.repeat(64);
const KEPT_DEVICE = 'b'.repeat(64);

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('removes only the given device', async () => {
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    await create({ id: REMOVED_DEVICE, name: null });
    await create({ id: KEPT_DEVICE, name: null });

    await remove(REMOVED_DEVICE);

    expect((await getAll()).map((device) => device.id)).toEqual([KEPT_DEVICE]);
  });
});
