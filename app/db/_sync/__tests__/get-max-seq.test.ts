// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getMaxSeq', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('grows by exactly one when one adventure is created', async () => {
    const { create } = await import('@db/adventure');
    const { getMaxSeq } = await import('../get-max-seq');
    const seqBefore = await getMaxSeq();

    await create();

    expect(await getMaxSeq()).toBe(seqBefore + 1);
  });

  it('reads 0 when the counter row is missing', async () => {
    const { getMaxSeq } = await import('../get-max-seq');
    const { getDatabase } = await import('@db/database');
    const db = await getDatabase();
    await db.execute("DELETE FROM _sync_meta WHERE id = 'seq'");

    expect(await getMaxSeq()).toBe(0);
  });
});
