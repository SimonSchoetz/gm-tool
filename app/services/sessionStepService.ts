import * as sessionStepDb from '@db/session-step';
import type { SessionStep, UpdateSessionStepInput } from '@db/session-step';
import {
  sessionStepLoadError,
  sessionStepCreateError,
  sessionStepUpdateError,
  sessionStepDeleteError,
  sessionStepReorderError,
} from '@domain';

export const getStepsBySessionId = async (
  sessionId: string,
): Promise<SessionStep[]> => {
  try {
    return await sessionStepDb.getAllBySession(sessionId);
  } catch (err) {
    throw sessionStepLoadError(err);
  }
};

export const updateStep = async (
  id: string,
  data: UpdateSessionStepInput,
): Promise<void> => {
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

export const createCustomStep = async (
  sessionId: string,
  name?: string,
): Promise<string> => {
  try {
    return await sessionStepDb.append({
      session_id: sessionId,
      ...(name !== undefined ? { name } : {}),
    });
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
    if (adjacentIndex < 0 || adjacentIndex >= steps.length) return;
    const adjacent = steps[adjacentIndex];

    const target = steps[index];
    await sessionStepDb.updateSortOrders([
      { id: target.id, sort_order: adjacent.sort_order },
      { id: adjacent.id, sort_order: target.sort_order },
    ]);
  } catch (err) {
    throw sessionStepReorderError(err);
  }
};

export const bulkReorderSteps = async (
  orderedStepIds: string[],
): Promise<void> => {
  try {
    await sessionStepDb.updateSortOrders(
      orderedStepIds.map((id, index) => ({ id, sort_order: index })),
    );
  } catch (err) {
    throw sessionStepReorderError(err);
  }
};
