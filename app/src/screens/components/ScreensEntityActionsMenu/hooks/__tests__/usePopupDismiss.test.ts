import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePopupDismiss } from '../usePopupDismiss';

const onDismiss = vi.fn<() => void>();

const setup = () => {
  const popup = document.createElement('div');
  const inside = document.createElement('button');
  popup.append(inside);
  document.body.append(popup);
  const popupRef = { current: popup };
  const hook = renderHook(() => {
    usePopupDismiss({ popupRef, onDismiss });
  });
  return { popup, inside, ...hook };
};

describe('usePopupDismiss', () => {
  beforeEach(() => {
    onDismiss.mockReset();
    document.body.replaceChildren();
  });

  it('dismisses on a mousedown outside the popup', () => {
    setup();

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss on a mousedown inside the popup', () => {
    const { inside } = setup();

    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('does not dismiss on a mousedown on the ignored element', () => {
    const gear = document.createElement('button');
    document.body.append(gear);
    renderHook(() => {
      usePopupDismiss({
        popupRef: { current: document.createElement('div') },
        ignoreRef: { current: gear },
        onDismiss,
      });
    });

    gear.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses when the window is resized', () => {
    setup();

    window.dispatchEvent(new Event('resize'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses on an outside mousedown while the popup element is not attached', () => {
    renderHook(() => {
      usePopupDismiss({ popupRef: { current: null }, onDismiss });
    });

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onDismiss after a rerender hands it a new one', () => {
    const first = vi.fn<() => void>();
    const second = vi.fn<() => void>();
    const popupRef = { current: document.createElement('div') };
    const { rerender } = renderHook(
      (props: { onDismiss: () => void }) => {
        usePopupDismiss({ popupRef, onDismiss: props.onDismiss });
      },
      { initialProps: { onDismiss: first } },
    );

    rerender({ onDismiss: second });
    window.dispatchEvent(new Event('resize'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops listening once the component unmounts', () => {
    const { unmount } = setup();

    unmount();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    window.dispatchEvent(new Event('resize'));

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
