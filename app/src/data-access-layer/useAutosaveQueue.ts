import { useEffect, useState } from 'react';
import { createAutosaveQueue, type AutosaveQueue } from './createAutosaveQueue';

export const useAutosaveQueue = <Patch>(
  merge: (pending: Patch, patch: Patch) => Patch,
  write: (key: string, pending: Patch) => void,
): AutosaveQueue<Patch> => {
  // Created in `useState`'s lazy initializer, never `useMemo`: every caller passes `write` as an inline closure that is new on each render, so a memo keyed on it would rebuild the queue, and the unmount effect would flush its pending edits, on every render; and React treats a memoized value as a cache it may discard.
  const [saveQueue] = useState(() => createAutosaveQueue(merge, write));

  // Flushing on unmount saves an edit made just before the screen closes; a save that fails there reaches no Error Boundary, because the component that would surface it is gone.
  useEffect(() => {
    return () => {
      saveQueue.flushAll();
    };
  }, [saveQueue]);

  return saveQueue;
};
