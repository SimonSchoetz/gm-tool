import type { ShowPopupArgs } from '../../PinnedPopupsContext';
import type { PopupEntry, RequestedPopupMode } from '../popupEntry';

export const requestPopup = (
  prev: PopupEntry[],
  args: ShowPopupArgs,
  zIndex: number,
  mode: RequestedPopupMode,
): PopupEntry[] => {
  const { onMouseEnterBridge, onMouseLeaveBridge, ...entry } = args;
  const isHover = mode === 'hover';
  const requested: PopupEntry = {
    ...entry,
    anchor: args.position,
    zIndex,
    mode,
    onMouseEnterBridge: isHover ? (onMouseEnterBridge ?? null) : null,
    onMouseLeaveBridge: isHover ? (onMouseLeaveBridge ?? null) : null,
  };
  const existing = prev.find((p) => p.entityId === args.entityId) ?? null;

  if (existing === null) return [...prev, requested];
  if (existing.mode === 'pinned') return prev;

  if (isHover) {
    if (existing.mode === 'click') return prev;
    return [...prev.filter((p) => p !== existing), requested];
  }

  if (existing.mode === 'hover') {
    return prev.map((p) =>
      p === existing
        ? {
            ...p,
            mode: 'click',
            onMouseEnterBridge: null,
            onMouseLeaveBridge: null,
          }
        : p,
    );
  }

  const isSameAnchor =
    existing.anchor.x === args.position.x &&
    existing.anchor.y === args.position.y;
  if (isSameAnchor) return prev;
  return prev.map((p) =>
    p === existing
      ? {
          ...p,
          anchor: args.position,
          position: args.position,
          placement: args.placement,
          zIndex,
        }
      : p,
  );
};
