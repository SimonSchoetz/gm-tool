// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SessionStep } from '@db/session-step';
import { LAZY_DM_STEPS } from '@domain';
import {
  testDatabase,
  writeFailingOnEachCall,
} from './support/failingDatabaseCall';

// Runs the real sessionService against the real in-memory database; sessionService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const load = async () => {
  const sessionService = await import('@services/sessionService');
  const adventureDb = await import('@db/adventure');
  const sessionStepDb = await import('@db/session-step');
  const { getDatabase } = await import('@db/database');
  const readSteps = async (sessionId: string) =>
    (await getDatabase()).select<SessionStep[]>(
      'SELECT * FROM session_steps WHERE session_id = $1 ORDER BY sort_order',
      [sessionId],
    );
  const countRows = async (table: string) =>
    (
      await (
        await getDatabase()
      ).select<{ count: number }[]>(
        // table is one of the literal names the tests below pass.
        `SELECT COUNT(*) AS count FROM ${table}`,
      )
    )[0].count;
  const db = await testDatabase(getDatabase);
  return {
    sessionService,
    adventureDb,
    sessionStepDb,
    readSteps,
    countRows,
    db,
  };
};

const copiedFields = ({
  name,
  content,
  default_step_key,
  checked,
  collapsed,
  sort_order,
}: SessionStep) => ({
  name,
  content,
  default_step_key,
  checked,
  collapsed,
  sort_order,
});

describe('sessionService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates a session holding exactly the Lazy DM steps, in order, under its own id', async () => {
    const { sessionService, adventureDb, readSteps } = await load();
    const adventureId = await adventureDb.create();
    const otherSessionId = await sessionService.createSession(adventureId);

    const sessionId = await sessionService.createSession(adventureId);

    const steps = await readSteps(sessionId);
    expect(
      steps.map(({ default_step_key, sort_order, session_id }) => ({
        default_step_key,
        sort_order,
        session_id,
      })),
    ).toEqual(
      LAZY_DM_STEPS.map((step, index) => ({
        default_step_key: step.key,
        sort_order: index,
        session_id: sessionId,
      })),
    );
    expect(sessionId).not.toBe(otherSessionId);
  });

  it('duplicates a session with copies of its steps, the custom one included, under new ids and no extra defaults, leaving the source unchanged', async () => {
    const { sessionService, adventureDb, sessionStepDb, readSteps } =
      await load();
    const adventureId = await adventureDb.create();
    const sourceId = await sessionService.createSession(adventureId);
    await sessionStepDb.create({
      session_id: sourceId,
      sort_order: LAZY_DM_STEPS.length,
      name: 'Custom step',
    });
    const sourceStepsBefore = await readSteps(sourceId);

    const copyId = await sessionService.duplicateSession(sourceId);

    const copySteps = await readSteps(copyId);
    expect(copySteps.map(copiedFields)).toEqual(
      sourceStepsBefore.map(copiedFields),
    );
    const sourceStepIds = new Set(sourceStepsBefore.map((step) => step.id));
    expect(copySteps.filter((step) => sourceStepIds.has(step.id))).toEqual([]);
    expect(await readSteps(sourceId)).toEqual(sourceStepsBefore);
  });

  it('leaves no session and no step behind when any database call of a session creation fails', async () => {
    const { sessionService, adventureDb, countRows, db } = await load();
    const adventureId = await adventureDb.create();

    await writeFailingOnEachCall(
      db,
      () => sessionService.createSession(adventureId),
      async () => {
        // Only the session of the counting run, with its steps.
        expect(await countRows('sessions')).toBe(1);
        expect(await countRows('session_steps')).toBe(LAZY_DM_STEPS.length);
      },
    );
  });

  it('leaves no copy and no copied step behind when any database call of a session duplication fails', async () => {
    const { sessionService, adventureDb, countRows, db } = await load();
    const adventureId = await adventureDb.create();
    const sourceId = await sessionService.createSession(adventureId);

    await writeFailingOnEachCall(
      db,
      () => sessionService.duplicateSession(sourceId),
      async () => {
        // The source and the counting run's copy, each with its steps.
        expect(await countRows('sessions')).toBe(2);
        expect(await countRows('session_steps')).toBe(2 * LAZY_DM_STEPS.length);
      },
    );
  });
});
