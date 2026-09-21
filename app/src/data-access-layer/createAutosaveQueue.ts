export const AUTOSAVE_DELAY_MS = 500;

export type AutosaveQueue<Patch> = {
  schedule: (key: string, patch: Patch) => void;
  flushAll: () => void;
};

type Entry<Patch> = {
  pending: Patch;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Debounces saves per key: the last edit before the user stops typing is written once, `AUTOSAVE_DELAY_MS` after it.
 * - It keeps one pending patch and one timer per key, so edits to different entities never merge or hold back each other's save.
 * - `write` receives the key the edit was scheduled under, and a hook whose mutation is keyed by an entity id passes it through `mutate()`'s call-time variables — the deferred-dispatch carve-out in `.claude/rules/src-data-access-layer.md` — because the hook may already show another entity when the timer fires.
 * - Hooks hold the queue through `useAutosaveQueue` (`useAutosaveQueue.ts`), which creates it once per hook instance and flushes it on unmount.
 */
export const createAutosaveQueue = <Patch>(
  merge: (pending: Patch, patch: Patch) => Patch,
  write: (key: string, pending: Patch) => void,
): AutosaveQueue<Patch> => {
  const entries = new Map<string, Entry<Patch>>();

  const startTimer = (key: string) =>
    setTimeout(() => {
      const entry = entries.get(key);
      if (!entry) return;
      entries.delete(key);
      write(key, entry.pending);
    }, AUTOSAVE_DELAY_MS);

  // An existing entry is updated in place, so a flush that is still iterating its snapshot sees a patch scheduled for a key it has not written yet.
  const schedule = (key: string, patch: Patch): void => {
    const existing = entries.get(key);
    if (existing) {
      clearTimeout(existing.timer);
      existing.pending = merge(existing.pending, patch);
      existing.timer = startTimer(key);
      return;
    }
    entries.set(key, { pending: patch, timer: startTimer(key) });
  };

  // The snapshot keeps an entry that a `write` schedules during the flush on its own timer, instead of flushing it again in the same pass.
  const flushAll = (): void => {
    for (const [key, entry] of [...entries]) {
      clearTimeout(entry.timer);
      entries.delete(key);
      write(key, entry.pending);
    }
  };

  return { schedule, flushAll };
};
