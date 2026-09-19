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
});
