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
