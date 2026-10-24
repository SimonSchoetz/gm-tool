import { renderHook } from '@testing-library/react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDismissClickOpened } from '../useDismissClickOpened';

const ENTITY_ID = 'goblin';

const renderDismiss = (isActive: boolean) => {
  const onDismiss = vi.fn();
  const hook = renderHook(() =>
    useDismissClickOpened({ isActive, anchorEntityId: ENTITY_ID, onDismiss }),
  );
  return { onDismiss, ...hook };
};

const clickOn = (target: Element) => {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

const pressKey = (key: string) => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key }));
};

const badgeOf = (entityId: string) => {
  const badge = document.createElement('span');
  badge.dataset.mentionAnchor = entityId;
  const inner = document.createElement('b');
  badge.append(inner);
  document.body.append(badge);
  return inner;
};

describe('useDismissClickOpened', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('does nothing on a click or Escape while inactive', () => {
    const { onDismiss } = renderDismiss(false);

    clickOn(document.body);
    pressKey('Escape');

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses once on a click outside', () => {
    const { onDismiss } = renderDismiss(true);

    clickOn(document.body);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores a click whose event was marked as inside', () => {
    const { onDismiss, result } = renderDismiss(true);
    const event = new MouseEvent('click', { bubbles: true });

    result.current.markInside({ nativeEvent: event } as React.MouseEvent);
    document.body.dispatchEvent(event);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses on a click after an earlier click was marked as inside', () => {
    const { onDismiss, result } = renderDismiss(true);
    result.current.markInside({
      nativeEvent: new MouseEvent('click'),
    } as React.MouseEvent);

    clickOn(document.body);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("ignores a click inside the popup's own badge but not inside another entity's badge", () => {
    const { onDismiss } = renderDismiss(true);

    clickOn(badgeOf(ENTITY_ID));
    expect(onDismiss).not.toHaveBeenCalled();

    clickOn(badgeOf('orc'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on Escape and not on another key', () => {
    const { onDismiss } = renderDismiss(true);

    pressKey('a');
    expect(onDismiss).not.toHaveBeenCalled();

    pressKey('Escape');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners on unmount', () => {
    const { onDismiss, unmount } = renderDismiss(true);

    unmount();
    clickOn(document.body);
    pressKey('Escape');

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
