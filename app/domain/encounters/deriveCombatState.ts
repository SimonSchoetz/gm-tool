import { readLogEntry } from './logEntryPayloads';

type CombatState = {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
  defeated: boolean;
  removed: boolean;
};

const applyDamage = (state: CombatState, amount: number): void => {
  if (state.maxHp === null || state.currentHp === null) {
    return;
  }
  const absorbedByTempHp = Math.min(state.tempHp, amount);
  state.tempHp -= absorbedByTempHp;
  state.currentHp -= amount - absorbedByTempHp;
};

const applyHeal = (state: CombatState, amount: number): void => {
  if (state.maxHp === null || state.currentHp === null) {
    return;
  }
  state.currentHp = Math.min(state.maxHp, state.currentHp + amount);
};

const applyMaxHp = (state: CombatState, value: number): void => {
  state.currentHp =
    state.currentHp === null ? value : Math.min(state.currentHp, value);
  state.maxHp = value;
};

export const deriveCombatState = (
  items: { id: string; startingMaxHp: number | null }[],
  entries: { kind: string; payload: string }[],
): Map<string, CombatState> => {
  const states = new Map<string, CombatState>(
    items.map((item) => [
      item.id,
      {
        maxHp: item.startingMaxHp,
        currentHp: item.startingMaxHp,
        tempHp: 0,
        defeated: false,
        removed: false,
      },
    ]),
  );

  for (const raw of entries) {
    const entry = readLogEntry(raw.kind, raw.payload);
    if (entry === null) {
      continue;
    }
    switch (entry.kind) {
      case 'added':
        break;
      case 'damage':
        for (const { queueItemId, amount } of entry.payload.targets) {
          const state = states.get(queueItemId) ?? null;
          if (state) applyDamage(state, amount);
        }
        break;
      case 'heal':
        for (const { queueItemId, amount } of entry.payload.targets) {
          const state = states.get(queueItemId) ?? null;
          if (state) applyHeal(state, amount);
        }
        break;
      case 'temp-hp':
        for (const { queueItemId, value } of entry.payload.targets) {
          const state = states.get(queueItemId) ?? null;
          if (state) state.tempHp = value;
        }
        break;
      case 'max-hp':
        for (const { queueItemId, value } of entry.payload.targets) {
          const state = states.get(queueItemId) ?? null;
          if (state) applyMaxHp(state, value);
        }
        break;
      case 'defeated':
      case 'undefeated':
      case 'removed':
        for (const queueItemId of entry.payload.queueItemIds) {
          const state = states.get(queueItemId) ?? null;
          if (!state) continue;
          if (entry.kind === 'removed') state.removed = true;
          else state.defeated = entry.kind === 'defeated';
        }
        break;
    }
  }

  return states;
};
