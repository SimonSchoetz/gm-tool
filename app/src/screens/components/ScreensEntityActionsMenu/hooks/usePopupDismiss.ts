import { useEffect, type RefObject } from 'react';
import { useEscapeDismiss } from '@/hooks/useEscapeDismiss';

type Params = {
  popupRef: RefObject<HTMLElement | null>;
  ignoreRef?: RefObject<HTMLElement | null>;
  onDismiss: () => void;
};

// Closes the popup that calls it, which exists only while open, on a `mousedown` outside it (not on `ignoreRef`'s element, the control that opens it and closes it on its own click), on Escape (through the shared `useEscapeDismiss`), and when the window is resized (a fixed popup placed from an anchor's rect read at open goes stale on a resize).
export const usePopupDismiss = ({ popupRef, ignoreRef, onDismiss }: Params) => {
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ignoreRef?.current?.contains(target)) return;
      if (!popupRef.current?.contains(target)) onDismiss();
    };

    document.addEventListener('mousedown', onMouseDown);
    window.addEventListener('resize', onDismiss);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('resize', onDismiss);
    };
  }, [popupRef, ignoreRef, onDismiss]);

  useEscapeDismiss(onDismiss, true);
};
