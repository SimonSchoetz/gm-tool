import { useEffect, useRef, type RefObject } from 'react';

type Dismiss = (event: KeyboardEvent) => void;

// Each active dismisser, oldest first; the last is the topmost popup.
const activeDismissers: RefObject<Dismiss>[] = [];

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return;
  const topmost = activeDismissers.at(-1) ?? null;
  // No test can observe this guard: the listener is added with the first dismisser and removed with the last, so the list is never empty when it runs, and the guard only narrows the type of `at(-1)`.
  if (!topmost) return;
  // Marks the key as taken for the Escape handlers that run after this one, such as clearing a selection.
  event.preventDefault();
  topmost.current(event);
};

// Closes the topmost active popup, and only it, on Escape. The capture phase makes `preventDefault()` run before any bubble-phase Escape handler reads `defaultPrevented`; propagation is never stopped, so a drag cancelled by Escape keeps working. The registering effect depends on `isActive` only: a popup keeps its place in the order when its callback changes.
export const useEscapeDismiss = (onDismiss: Dismiss, isActive: boolean) => {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!isActive) return;

    activeDismissers.push(dismissRef);
    if (activeDismissers.length === 1) {
      document.addEventListener('keydown', onKeyDown, true);
    }
    return () => {
      activeDismissers.splice(activeDismissers.indexOf(dismissRef), 1);
      if (activeDismissers.length === 0) {
        document.removeEventListener('keydown', onKeyDown, true);
      }
    };
  }, [isActive]);
};
