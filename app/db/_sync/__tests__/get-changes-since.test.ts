// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getChangesSince', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the changes after the given seq in ascending order, at most the limit, and none at or before the seq', async () => {
    const { create } = await import('@db/adventure');
    const { getChangesSince } = await import('../get-changes-since');
    const { getMaxSeq } = await import('../get-max-seq');
    await create();
    const secondId = await create();
    const thirdId = await create();
    await create();
    const seqBeforeSecond = (await getMaxSeq()) - 3;

    const changes = await getChangesSince(seqBeforeSecond, 2);

    expect(changes.map((change) => change.row_id)).toEqual([secondId, thirdId]);
    expect(changes.map((change) => change.seq)).toEqual([
      seqBeforeSecond + 1,
      seqBeforeSecond + 2,
    ]);
  });
});
