import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRouterState } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { MentionPopup } from '../../components/MentionPopup';
import type { PopupPosition, PopupPlacement } from '../../components/MentionPopup';
import {
  PinnedPopupsContext,
  ShowPopupArgs,
  PinnedPopupsContextValue,
} from './PinnedPopupsContext';

type PopupEntry = {
  entityId: string;
  entityType: string;
  adventureId: string | null;
  name: string;
  position: PopupPosition;
  placement: PopupPlacement;
  zIndex: number;
  pinned: boolean;
  onMouseEnterBridge: (() => void) | null;
  onMouseLeaveBridge: (() => void) | null;
};

type Props = { children: ReactNode };

export const PinnedPopupsProvider: FCProps<Props> = ({ children }) => {
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const topZRef = useRef(1000);

  const routerState = useRouterState();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional route-change cleanup; setState is stable and no external subscription is needed
    setPopups([]);
  }, [routerState.location.pathname]);

  const showPopup = (args: ShowPopupArgs) => {
    const { onMouseEnterBridge, onMouseLeaveBridge, ...entry } = args;
    topZRef.current += 1;
    setPopups((prev) => [
      ...prev.filter((p) => p.entityId !== args.entityId),
      {
        ...entry,
        zIndex: topZRef.current,
        pinned: false,
        onMouseEnterBridge: onMouseEnterBridge ?? null,
        onMouseLeaveBridge: onMouseLeaveBridge ?? null,
      },
    ]);
  };

  const hidePopup = (entityId: string) => {
    setPopups((prev) =>
      prev.filter((p) => p.entityId !== entityId || p.pinned),
    );
  };

  const pinPopup = (entityId: string) => {
    setPopups((prev) =>
      prev.map((p) =>
        p.entityId === entityId
          ? {
              ...p,
              pinned: true,
              onMouseEnterBridge: null,
              onMouseLeaveBridge: null,
            }
          : p,
      ),
    );
  };

  const removePopup = (entityId: string) => {
    setPopups((prev) => prev.filter((p) => p.entityId !== entityId));
  };

  const hasPopup = (entityId: string) =>
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
    showPopup,
    hidePopup,
    pinPopup,
    removePopup,
    hasPopup,
  };

  return (
    <PinnedPopupsContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <>
          {popups.map((entry) => {
            const {
              pinned,
              onMouseEnterBridge,
              onMouseLeaveBridge,
              ...entrySpread
            } = entry;
            return (
              <MentionPopup
                key={entry.entityId}
                {...entrySpread}
                initialIsPinned={pinned}
                onRemove={() => {
                  removePopup(entry.entityId);
                }}
                onPin={() => {
                  pinPopup(entry.entityId);
                }}
                onPositionChange={(pos) => {
                  updatePopupPosition(entry.entityId, pos);
                }}
                onBringToFront={() => {
                  topZRef.current += 1;
                  updatePopupZIndex(entry.entityId, topZRef.current);
                }}
                {...(onMouseEnterBridge !== null && { onMouseEnterBridge })}
                {...(onMouseLeaveBridge !== null && { onMouseLeaveBridge })}
              />
            );
          })}
        </>,
        document.body,
      )}
    </PinnedPopupsContext.Provider>
  );
};
