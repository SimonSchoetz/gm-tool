import { describe, it, expect, vi } from 'vitest';
import type { ShowPopupArgs } from '../../../PinnedPopupsContext';
import type { PopupEntry } from '../../popupEntry';
import { requestPopup } from '../requestPopup';

const bridge = vi.fn();

const args = (overrides: Partial<ShowPopupArgs> = {}): ShowPopupArgs => ({
  entityId: 'goblin',
  entityType: 'npc',
  adventureId: 'adventure-1',
  name: 'Goblin',
  position: { x: 10, y: 20 },
  placement: 'below',
  ...overrides,
});

const entry = (overrides: Partial<PopupEntry> = {}): PopupEntry => ({
  entityId: 'goblin',
  entityType: 'npc',
  adventureId: 'adventure-1',
  name: 'Goblin',
  position: { x: 10, y: 20 },
  anchor: { x: 10, y: 20 },
  placement: 'below',
  zIndex: 1001,
  mode: 'hover',
  onMouseEnterBridge: bridge,
  onMouseLeaveBridge: bridge,
  ...overrides,
});

const other = entry({ entityId: 'orc', name: 'Orc', zIndex: 1000 });

describe('requestPopup', () => {
  it('adds a hover entry with the bridges from the args', () => {
    const next = requestPopup(
      [other],
      args({ onMouseEnterBridge: bridge, onMouseLeaveBridge: bridge }),
      1002,
      'hover',
    );

    expect(next).toEqual([
      other,
      entry({
        zIndex: 1002,
        onMouseEnterBridge: bridge,
        onMouseLeaveBridge: bridge,
      }),
    ]);
  });

  it('replaces a hover entry on another hover request and keeps other entities', () => {
    const next = requestPopup(
      [entry({ position: { x: 1, y: 1 } }), other],
      args({ position: { x: 50, y: 60 } }),
      1002,
      'hover',
    );

    expect(next).toHaveLength(2);
    expect(next).toContain(other);
    expect(next.find((p) => p.entityId === 'goblin')?.position).toEqual({
      x: 50,
      y: 60,
    });
  });

  it.each(['click', 'pinned'] as const)(
    'keeps a %s entry when a hover request arrives',
    (mode) => {
      const prev = [entry({ mode }), other];

      expect(requestPopup(prev, args(), 1002, 'hover')).toBe(prev);
    },
  );

  it('adds a click entry without bridges', () => {
    const next = requestPopup(
      [other],
      args({ onMouseEnterBridge: bridge, onMouseLeaveBridge: bridge }),
      1002,
      'click',
    );

    expect(next).toEqual([
      other,
      entry({
        zIndex: 1002,
        mode: 'click',
        onMouseEnterBridge: null,
        onMouseLeaveBridge: null,
      }),
    ]);
  });

  it('promotes a hover entry to click without moving it and drops its bridges', () => {
    const hovered = entry({ position: { x: 5, y: 5 }, anchor: { x: 7, y: 7 } });

    const next = requestPopup(
      [hovered, other],
      args({ position: { x: 90, y: 90 } }),
      1002,
      'click',
    );

    expect(next).toEqual([
      {
        ...hovered,
        mode: 'click',
        onMouseEnterBridge: null,
        onMouseLeaveBridge: null,
      },
      other,
    ]);
  });

  it('re-anchors a click entry at a different anchor and keeps other entities', () => {
    const clicked = entry({
      mode: 'click',
      onMouseEnterBridge: null,
      onMouseLeaveBridge: null,
    });

    const next = requestPopup(
      [clicked, other],
      args({ position: { x: 200, y: 300 }, placement: 'above' }),
      1002,
      'click',
    );

    expect(next).toEqual([
      {
        ...clicked,
        anchor: { x: 200, y: 300 },
        position: { x: 200, y: 300 },
        placement: 'above',
        zIndex: 1002,
      },
      other,
    ]);
  });

  it('re-anchors a click entry when only the vertical anchor differs', () => {
    const clicked = entry({ mode: 'click' });

    const next = requestPopup(
      [clicked],
      args({ position: { x: clicked.anchor.x, y: clicked.anchor.y + 40 } }),
      1002,
      'click',
    );

    expect(next[0].anchor).toEqual({
      x: clicked.anchor.x,
      y: clicked.anchor.y + 40,
    });
  });

  it('leaves a click entry as it is, dragged position and z-index included, on a click at the same anchor', () => {
    const dragged = entry({
      mode: 'click',
      position: { x: 400, y: 500 },
      onMouseEnterBridge: null,
      onMouseLeaveBridge: null,
    });
    const prev = [dragged, other];

    expect(requestPopup(prev, args(), 1002, 'click')).toBe(prev);
  });

  it('leaves a pinned entry as it is on a click', () => {
    const prev = [entry({ mode: 'pinned' }), other];

    expect(
      requestPopup(prev, args({ position: { x: 99, y: 99 } }), 1002, 'click'),
    ).toBe(prev);
  });
});
