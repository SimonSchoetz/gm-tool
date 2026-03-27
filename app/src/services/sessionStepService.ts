import * as sessionStepDb from '@db/session-step';
import type { SessionStep, CreateSessionStepInput, UpdateSessionStepInput } from '@db/session-step';
import {
  LAZY_DM_STEPS,
  sessionStepLoadError,
  sessionStepCreateError,
  sessionStepUpdateError,
  sessionStepDeleteError,
  sessionStepReorderError,
} from '@/domain/session-steps';

export const getStepsBySessionId = async (sessionId: string): Promise<SessionStep[]> => {
  try {
    return await sessionStepDb.getAllBySession(sessionId);
  } catch (err) {
    throw sessionStepLoadError(err);
  }
};

export const createStep = async (data: CreateSessionStepInput): Promise<string> => {
  try {
    return await sessionStepDb.create(data);
  } catch (err) {
    throw sessionStepCreateError(err);
  }
};

export const updateStep = async (id: string, data: UpdateSessionStepInput): Promise<void> => {
  try {
    await sessionStepDb.update(id, data);
  } catch (err) {
    throw sessionStepUpdateError(id, err);
  }
};

export const deleteStep = async (id: string): Promise<void> => {
  try {
    await sessionStepDb.remove(id);
  } catch (err) {
    throw sessionStepDeleteError(id, err);
  }
};

export const createCustomStep = async (sessionId: string, name?: string): Promise<string> => {
  try {
    const steps = await sessionStepDb.getAllBySession(sessionId);
    const maxSortOrder = steps.length > 0 ? Math.max(...steps.map((s) => s.sort_order)) : -1;
    const newStepId = await sessionStepDb.create({
      session_id: sessionId,
      sort_order: maxSortOrder + 1,
      checked: 0,
    });
    await sessionStepDb.update(newStepId, { name: name ?? 'New Step' });
    return newStepId;
  } catch (err) {
    throw sessionStepCreateError(err);
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
    throw sessionStepReorderError(err);
  }
};

export const bulkReorderSteps = async (orderedStepIds: string[]): Promise<void> => {
  try {
    for (let index = 0; index < orderedStepIds.length; index++) {
      await sessionStepDb.update(orderedStepIds[index], { sort_order: index });
    }
  } catch (err) {
    throw sessionStepReorderError(err);
  }
};

export const initDefaultSteps = async (sessionId: string): Promise<void> => {
  try {
    for (let index = 0; index < LAZY_DM_STEPS.length; index++) {
      const step = LAZY_DM_STEPS[index];
      const newStepId = await sessionStepDb.create({
        session_id: sessionId,
        sort_order: index,
        checked: 0,
      });
      await sessionStepDb.update(newStepId, {
        name: step.name,
        default_step_key: step.key,
      });
    }
  } catch (err) {
    throw sessionStepCreateError(err);
  }
};
