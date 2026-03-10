import * as sessionStepDb from '@db/session-step';
import type { SessionStep, CreateSessionStepInput, UpdateSessionStepInput } from '@db/session-step';
import {
  LAZY_DM_STEPS,
  SessionStepLoadError,
  SessionStepCreateError,
  SessionStepUpdateError,
  SessionStepDeleteError,
  SessionStepReorderError,
} from '@/domain/session-steps';

export const getStepsBySessionId = async (sessionId: string): Promise<SessionStep[]> => {
  try {
    return await sessionStepDb.getAllBySession(sessionId);
  } catch (err) {
    throw new SessionStepLoadError(err);
  }
};

export const createStep = async (data: CreateSessionStepInput): Promise<string> => {
  try {
    return await sessionStepDb.create(data);
  } catch (err) {
    throw new SessionStepCreateError(err);
  }
};

export const updateStep = async (id: string, data: UpdateSessionStepInput): Promise<void> => {
  try {
    await sessionStepDb.update(id, data);
  } catch (err) {
    throw new SessionStepUpdateError(id, err);
  }
};

export const deleteStep = async (id: string): Promise<void> => {
  try {
    await sessionStepDb.remove(id);
  } catch (err) {
    throw new SessionStepDeleteError(id, err);
  }
};

export const createCustomStep = async (sessionId: string, name?: string): Promise<string> => {
  try {
    const steps = await sessionStepDb.getAllBySession(sessionId);
    const maxSortOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.sort_order)) : -1;
    return await sessionStepDb.create({
      session_id: sessionId,
      name: name ?? 'New Step',
      sort_order: maxSortOrder + 1,
      checked: 0,
    });
  } catch (err) {
    throw new SessionStepCreateError(err);
  }
};

export const swapStepOrder = async (
  sessionId: string,
  stepId: string,
  direction: 'up' | 'down',
): Promise<void> => {
  try {
    const steps = await sessionStepDb.getAllBySession(sessionId);
    const index = steps.findIndex((s) => s.id === stepId);
    if (index === -1) return;

    const adjacentIndex = direction === 'up' ? index - 1 : index + 1;
    const adjacent = steps[adjacentIndex];
    if (!adjacent) return;

    const target = steps[index];
    await sessionStepDb.update(target.id, { sort_order: adjacent.sort_order });
    await sessionStepDb.update(adjacent.id, { sort_order: target.sort_order });
  } catch (err) {
    throw new SessionStepReorderError(err);
  }
};

export const bulkReorderSteps = async (orderedStepIds: string[]): Promise<void> => {
  try {
    for (let index = 0; index < orderedStepIds.length; index++) {
      await sessionStepDb.update(orderedStepIds[index], { sort_order: index });
    }
  } catch (err) {
    throw new SessionStepReorderError(err);
  }
};

export const initDefaultSteps = async (sessionId: string): Promise<void> => {
  try {
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
  } catch (err) {
    throw new SessionStepCreateError(err);
  }
};
