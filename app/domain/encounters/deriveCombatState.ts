import { isRevertibleLogEntryKind, readLogEntry } from './logEntryPayloads';

type Hp = { max: number; current: number };
type TrackedState = {
  hp: Hp | null;
  tempHp: number;
  defeated: boolean;
  removed: boolean;
};

const applyDamage = (state: TrackedState, amount: number): void => {
  if (state.hp === null) {
    return;
  }
  const absorbedByTempHp = Math.min(state.tempHp, amount);
  state.tempHp -= absorbedByTempHp;
  state.hp.current -= amount - absorbedByTempHp;
};

const applyHeal = (state: TrackedState, amount: number): void => {
  if (state.hp === null) {
    return;
  }
  state.hp.current = Math.min(state.hp.max, state.hp.current + amount);
};

const applyMaxHp = (state: TrackedState, value: number): void => {
  state.hp = {
    max: value,
    current: state.hp === null ? value : Math.min(state.hp.current, value),
  };
};

type DerivedItemState = {
  maxHp: number | null;
  currentHp: number | null;
  tempHp: number;
  defeated: boolean;
  removed: boolean;
};

export const deriveCombatState = (
  items: { id: string; startingMaxHp: number | null }[],
  entries: { id: string; kind: string; payload: string }[],
): {
  items: Map<string, DerivedItemState>;
  revertedEntryIds: ReadonlySet<string>;
} => {
  const states = new Map<string, TrackedState>(
    items.map((item) => [
      item.id,
      {
        hp:
          item.startingMaxHp === null
            ? null
            : { max: item.startingMaxHp, current: item.startingMaxHp },
        tempHp: 0,
        defeated: false,
        removed: false,
      },
    ]),
  );

  const readEntries = entries.map((raw) => ({
    id: raw.id,
    entry: readLogEntry(raw.kind, raw.payload),
  }));
  const revertibleEntryIds = new Set(
    readEntries
      .filter(
        ({ entry }) => entry !== null && isRevertibleLogEntryKind(entry.kind),
      )
      .map(({ id }) => id),
  );
  // A revert drops its target wherever the target sits in the order, so a sync that delivers the revert first changes nothing.
  const revertedEntryIds = new Set<string>();
  for (const { entry } of readEntries) {
    if (entry?.kind !== 'revert') {
      continue;
    }
    if (revertibleEntryIds.has(entry.payload.entryId)) {
      revertedEntryIds.add(entry.payload.entryId);
    }
  }

  for (const { id, entry } of readEntries) {
    if (entry === null || revertedEntryIds.has(id)) {
      continue;
    }
    switch (entry.kind) {
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

  return {
    items: new Map(
      [...states].map(([id, { hp, tempHp, defeated, removed }]) => [
        id,
        {
          maxHp: hp?.max ?? null,
          currentHp: hp?.current ?? null,
          tempHp,
          defeated,
          removed,
        },
      ]),
    ),
    revertedEntryIds,
  };
};
