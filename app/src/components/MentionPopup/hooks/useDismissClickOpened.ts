import { useEffect, useRef } from 'react';

type Args = {
  isActive: boolean;
  anchorEntityId: string;
  onDismiss: () => void;
};

export const useDismissClickOpened = ({
  isActive,
  anchorEntityId,
  onDismiss,
}: Args): { markInside: (event: React.MouseEvent) => void } => {
  // React's root listener runs before the document listener, so an inside click is marked before the listener sees it; comparing the event (not a flag) cannot go stale when a click never reaches document.
  const insideEventRef = useRef<Event | null>(null);

  const markInside = (event: React.MouseEvent) => {
    insideEventRef.current = event.nativeEvent;
  };

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      if (event === insideEventRef.current) return;
      const isOnOwnBadge =
        event.target instanceof Element &&
        event.target.closest(`[data-mention-anchor="${anchorEntityId}"]`) !==
          null;
      if (isOnOwnBadge) return;
      onDismiss();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, anchorEntityId, onDismiss]);

  return { markInside };
};
