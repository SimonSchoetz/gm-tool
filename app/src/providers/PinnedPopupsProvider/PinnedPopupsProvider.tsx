import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouterState } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { MentionPopup } from '@/components';
import type { PopupPosition } from '@/components';
import {
  PinnedPopupsContext,
  PinPopupArgs,
  PinnedPopupsContextValue,
} from './PinnedPopupsContext';

type PinnedPopupEntry = PinPopupArgs & { zIndex: number };

export const PinnedPopupsProvider: FCProps<{ children: ReactNode }> = ({
  children,
}) => {
  const [popups, setPopups] = useState<PinnedPopupEntry[]>([]);
  const topZRef = useRef(1000);

  const routerState = useRouterState();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional route-change cleanup; setState is stable and no external subscription is needed
    setPopups([]);
  }, [routerState.location.pathname]);

  const pinPopup = (args: PinPopupArgs) => {
    topZRef.current += 1;
    setPopups((prev) => [
      ...prev.filter((p) => p.entityId !== args.entityId),
      { ...args, zIndex: topZRef.current },
    ]);
  };

  const removePopup = (entityId: string) => {
    setPopups((prev) => prev.filter((p) => p.entityId !== entityId));
  };

  const isPinned = (entityId: string) =>
    popups.some((p) => p.entityId === entityId);

  const updatePopupZIndex = (entityId: string, zIndex: number) => {
    setPopups((prev) =>
      prev.map((p) => (p.entityId === entityId ? { ...p, zIndex } : p)),
    );
  };

  const updatePopupPosition = (entityId: string, position: PopupPosition) => {
    setPopups((prev) =>
      prev.map((p) => (p.entityId === entityId ? { ...p, position } : p)),
    );
  };

  const contextValue: PinnedPopupsContextValue = {
    pinPopup,
    removePopup,
    isPinned,
    updatePopupZIndex,
    updatePopupPosition,
  };

  return (
    <PinnedPopupsContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <>
          {popups.map((entry) => (
            <MentionPopup
              key={entry.entityId}
              entityId={entry.entityId}
              entityType={entry.entityType}
              adventureId={entry.adventureId}
              position={entry.position}
              placement={entry.placement}
              zIndex={entry.zIndex}
              initialIsPinned
              onRemove={() => {
                removePopup(entry.entityId);
              }}
              onPositionChange={(pos) => {
                updatePopupPosition(entry.entityId, pos);
              }}
              onBringToFront={() => {
                topZRef.current += 1;
                updatePopupZIndex(entry.entityId, topZRef.current);
              }}
            />
          ))}
        </>,
        document.body,
      )}
    </PinnedPopupsContext.Provider>
  );
};
