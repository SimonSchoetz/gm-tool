export const AUTOSAVE_DELAY_MS = 500;

type AutosaveQueue<Patch> = {
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
 * - `write` receives the key the edit was scheduled under, and a hook passes it through `mutate()`'s call-time variables — the deferred-dispatch carve-out in `.claude/rules/src-data-access-layer.md` — because the hook may already show another entity when the timer fires.
 * - A hook holds the queue in `useState`'s lazy initializer, which runs once per hook instance and gives the queue a non-null type; `useMemo` would have to list the hook's mutation object (`updateMutation`, or `renameMutation` in `useOwnDevice`) in its dependencies, and `useMutation` returns a new object on every render, so the queue would be rebuilt — and flushed by the unmount effect — on every render.
 * - A hook calls `flushAll()` from an unmount effect so edits made just before leaving a screen are saved, and a save flushed there that fails is not reported, because the component that would surface the error is gone.
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
