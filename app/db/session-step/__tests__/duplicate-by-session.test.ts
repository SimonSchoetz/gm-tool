// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionStep } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readSteps = async (sessionId: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<SessionStep[]>(
    'SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order',
    [sessionId],
  );
};

// Sort orders 7 and 3 are not array positions, so a copy that re-derives the order shows. Every copied column holds a non-default value on the source.
const seedSourceAndEmptyTarget = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createSession } = await import('@db/session');
  const { create } = await import('../create');
  const { update } = await import('../update');
  const adventureId = await createAdventure();
  const sourceSessionId = await createSession(adventureId);
  const targetSessionId = await createSession(adventureId);
  const first = await create({
    session_id: sourceSessionId,
    sort_order: 7,
    name: 'Step A',
    default_step_key: 'strong_start',
  });
  const second = await create({
    session_id: sourceSessionId,
    sort_order: 3,
    name: 'Step B',
    default_step_key: 'secrets_clues',
  });
  await update(first, { content: 'c', checked: 1 });
  await update(second, { content: 'c', checked: 1 });
  return { sourceSessionId, targetSessionId };
};

describe('duplicateBySession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies every step to the target session under a fresh id with the same columns and new timestamps', async () => {
    const { duplicateBySession } = await import('../duplicate-by-session');
    const { sourceSessionId, targetSessionId } =
      await seedSourceAndEmptyTarget();
    const sourceIds = (await readSteps(sourceSessionId)).map((step) => step.id);
    vi.setSystemTime(new Date(T2));

    await duplicateBySession(sourceSessionId, targetSessionId);

    const copies = await readSteps(targetSessionId);
    expect(copies.map(({ id: _id, ...columns }) => columns)).toEqual([
      {
        session_id: targetSessionId,
        name: 'Step B',
        content: 'c',
        default_step_key: 'secrets_clues',
        checked: 1,
        sort_order: 3,
        created_at: T2,
        updated_at: T2,
      },
      {
        session_id: targetSessionId,
        name: 'Step A',
        content: 'c',
        default_step_key: 'strong_start',
        checked: 1,
        sort_order: 7,
        created_at: T2,
        updated_at: T2,
      },
    ]);
    for (const copy of copies) {
      expect(sourceIds).not.toContain(copy.id);
    }
  });

  it("leaves the source session's steps unchanged", async () => {
    const { duplicateBySession } = await import('../duplicate-by-session');
    const { sourceSessionId, targetSessionId } =
      await seedSourceAndEmptyTarget();
    const before = await readSteps(sourceSessionId);
    vi.setSystemTime(new Date(T2));

    await duplicateBySession(sourceSessionId, targetSessionId);

    expect(await readSteps(sourceSessionId)).toEqual(before);
  });
});
