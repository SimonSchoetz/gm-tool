// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionStep, UpdateSessionStepInput } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const readStep = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<SessionStep[]>(
    'SELECT * FROM session_steps WHERE id = $1',
    [id],
  );
  return rows[0];
};

const createStep = async (sortOrder = 1) => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createSession } = await import('@db/session');
  const { create } = await import('../create');
  const sessionId = await createSession(await createAdventure());
  return create({ session_id: sessionId, sort_order: sortOrder });
};

describe('update', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('writes checked 0 and sort order 0 over the values 1', async () => {
    const { update } = await import('../update');
    const id = await createStep(1);
    await update(id, { checked: 1 });
    expect(await readStep(id)).toMatchObject({ checked: 1, sort_order: 1 });

    await update(id, { checked: 0, sort_order: 0 });

    expect(await readStep(id)).toMatchObject({ checked: 0, sort_order: 0 });
  });

  it('clears name and content when they are set to null', async () => {
    const { update } = await import('../update');
    const id = await createStep();
    await update(id, { name: 'to clear', content: 'to clear too' });
    expect(await readStep(id)).toMatchObject({
      name: 'to clear',
      content: 'to clear too',
    });

    await update(id, { name: null, content: null });

    expect(await readStep(id)).toMatchObject({ name: null, content: null });
  });

  it('rejects a step key outside the lazy DM keys and leaves the row unchanged', async () => {
    const { update } = await import('../update');
    const id = await createStep();
    const before = await readStep(id);

    await expect(
      update(id, {
        default_step_key: 'bogus',
      } as unknown as UpdateSessionStepInput),
    ).rejects.toThrow();

    expect(await readStep(id)).toEqual(before);
  });
});
