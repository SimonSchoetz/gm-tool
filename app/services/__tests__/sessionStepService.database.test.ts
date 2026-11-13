// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionStep } from '@db/session-step';
import {
  testDatabase,
  writeFailingOnCall,
} from './support/failingDatabaseCall';

// Runs the real sessionStepService against the real in-memory database; sessionStepService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const load = async () => {
  const sessionStepService = await import('@services/sessionStepService');
  const adventureDb = await import('@db/adventure');
  const sessionDb = await import('@db/session');
  const sessionStepDb = await import('@db/session-step');
  const { getDatabase } = await import('@db/database');
  const readSteps = async (sessionId: string) =>
    (await getDatabase()).select<Pick<SessionStep, 'id' | 'sort_order'>[]>(
      'SELECT id, sort_order FROM session_steps WHERE session_id = $1 ORDER BY sort_order',
      [sessionId],
    );
  const adventureId = await adventureDb.create();
  const createSessionWithSteps = async (sortOrders: number[]) => {
    const sessionId = await sessionDb.create(adventureId);
    const stepIds: string[] = [];
    for (const sortOrder of sortOrders) {
      stepIds.push(
        await sessionStepDb.create({
          session_id: sessionId,
          sort_order: sortOrder,
        }),
      );
    }
    return { sessionId, stepIds };
  };
  const db = await testDatabase(getDatabase);
  return { sessionStepService, readSteps, createSessionWithSteps, db };
};

describe('sessionStepService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores two custom steps at consecutive sort orders after the session’s highest, unaffected by another session’s steps', async () => {
    const { sessionStepService, readSteps, createSessionWithSteps } =
      await load();
    await createSessionWithSteps([20, 21]);
    const {
      sessionId,
      stepIds: [existingId],
    } = await createSessionWithSteps([4]);

    const firstId = await sessionStepService.createCustomStep(sessionId);
    const secondId = await sessionStepService.createCustomStep(
      sessionId,
      'Named',
    );

    expect(await readSteps(sessionId)).toEqual([
      { id: existingId, sort_order: 4 },
      { id: firstId, sort_order: 5 },
      { id: secondId, sort_order: 6 },
    ]);
  });

  it('swaps a step with the one above it, so a later read returns the swapped order', async () => {
    const { sessionStepService, readSteps, createSessionWithSteps } =
      await load();
    const {
      sessionId,
      stepIds: [first, second, third],
    } = await createSessionWithSteps([0, 1, 2]);

    await sessionStepService.swapStepOrder(sessionId, second, 'up');

    expect((await readSteps(sessionId)).map((step) => step.id)).toEqual([
      second,
      first,
      third,
    ]);
  });

  it('reorders steps in bulk, so a later read returns the requested order', async () => {
    const { sessionStepService, readSteps, createSessionWithSteps } =
      await load();
    const {
      sessionId,
      stepIds: [first, second, third],
    } = await createSessionWithSteps([0, 1, 2]);

    await sessionStepService.bulkReorderSteps([third, first, second]);

    expect((await readSteps(sessionId)).map((step) => step.id)).toEqual([
      third,
      first,
      second,
    ]);
  });

  it('stores two custom steps added at the same time at two different sort orders', async () => {
    const { sessionStepService, readSteps, createSessionWithSteps } =
      await load();
    const { sessionId } = await createSessionWithSteps([0]);

    await Promise.all([
      sessionStepService.createCustomStep(sessionId),
      sessionStepService.createCustomStep(sessionId),
    ]);

    expect((await readSteps(sessionId)).map((step) => step.sort_order)).toEqual(
      [0, 1, 2],
    );
  });

  it('leaves the old order or the whole new one, never a mix, when any database call of a bulk reorder or a swap fails', async () => {
    const { sessionStepService, readSteps, createSessionWithSteps, db } =
      await load();
    const {
      sessionId,
      stepIds: [first, second, third],
    } = await createSessionWithSteps([0, 1, 2]);
    const storedOrder = async () =>
      (await readSteps(sessionId)).map((step) => step.sort_order);
    const sortOrderOf = async (id: string) =>
      (await readSteps(sessionId)).find((step) => step.id === id)?.sort_order;

    for (const callNumber of [1, 2, 3]) {
      await writeFailingOnCall(db, callNumber, () =>
        sessionStepService.bulkReorderSteps([third, first, second]),
      );
      const ids = (await readSteps(sessionId)).map((step) => step.id);
      expect([
        [first, second, third],
        [third, first, second],
      ]).toContainEqual(ids);
      expect(await storedOrder()).toEqual([0, 1, 2]);
      await sessionStepService.bulkReorderSteps([first, second, third]);
    }

    for (const callNumber of [1, 2, 3]) {
      const before = [await sortOrderOf(first), await sortOrderOf(second)];
      await writeFailingOnCall(db, callNumber, () =>
        sessionStepService.swapStepOrder(sessionId, second, 'up'),
      );
      const after = [await sortOrderOf(first), await sortOrderOf(second)];
      expect([before, [...before].reverse()]).toContainEqual(after);
    }
  });
});
