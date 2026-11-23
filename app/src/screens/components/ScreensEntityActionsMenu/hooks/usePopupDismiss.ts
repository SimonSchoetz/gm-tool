import { useEffect, type RefObject } from 'react';

type Params = {
  popupRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
};

// Closes the popup that calls it, which exists only while open, on a `mousedown` outside it, on Escape, and when the window is resized (a fixed popup placed from an anchor's rect read at open goes stale on a resize).
export const usePopupDismiss = ({ popupRef, onDismiss }: Params) => {
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!popupRef.current?.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onDismiss);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onDismiss);
    };
  }, [popupRef, onDismiss]);
};
