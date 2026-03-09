import * as sessionStepDb from '@db/session-step';
import type { SessionStep, CreateSessionStepInput, UpdateSessionStepInput } from '@db/session-step';
import { LAZY_DM_STEPS } from '@/domain/session-steps';

export const getStepsBySessionId = async (sessionId: string): Promise<SessionStep[]> =>
  sessionStepDb.getAllBySession(sessionId);

export const createStep = async (data: CreateSessionStepInput): Promise<string> =>
  sessionStepDb.create(data);

export const updateStep = async (id: string, data: UpdateSessionStepInput): Promise<void> =>
  sessionStepDb.update(id, data);

export const deleteStep = async (id: string): Promise<void> =>
  sessionStepDb.remove(id);

export const createCustomStep = async (sessionId: string, name?: string): Promise<string> => {
  const steps = await sessionStepDb.getAllBySession(sessionId);
  const maxSortOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.sort_order)) : -1;
  return sessionStepDb.create({
    session_id: sessionId,
    name: name ?? 'New Step',
    sort_order: maxSortOrder + 1,
    checked: 0,
  });
};

export const swapStepOrder = async (
  sessionId: string,
  stepId: string,
  direction: 'up' | 'down',
): Promise<void> => {
  const steps = await sessionStepDb.getAllBySession(sessionId);
  const index = steps.findIndex((s) => s.id === stepId);
  if (index === -1) return;

  const adjacentIndex = direction === 'up' ? index - 1 : index + 1;
  const adjacent = steps[adjacentIndex];
  if (!adjacent) return;

  const target = steps[index];
  await sessionStepDb.update(target.id, { sort_order: adjacent.sort_order });
  await sessionStepDb.update(adjacent.id, { sort_order: target.sort_order });
};

export const initDefaultSteps = async (sessionId: string): Promise<void> => {
  for (let index = 0; index < LAZY_DM_STEPS.length; index++) {
    const step = LAZY_DM_STEPS[index];
    await sessionStepDb.create({
      session_id: sessionId,
      name: step.name,
      default_step_key: step.key,
      sort_order: index,
      checked: 0,
    });
  }
};
