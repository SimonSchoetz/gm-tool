import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The module keeps the list of active dismissers, so each test gets a fresh one.
const loadHook = async () =>
  (await import('../useEscapeDismiss')).useEscapeDismiss;

const pressEscape = () => {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
  });
  document.body.dispatchEvent(event);
  return event;
};

describe('useEscapeDismiss', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calls an active dismisser once with the key event and prevents its default', async () => {
    const useEscapeDismiss = await loadHook();
    const onDismiss = vi.fn<(event: KeyboardEvent) => void>();
    renderHook(() => {
      useEscapeDismiss(onDismiss, true);
    });

    const event = pressEscape();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('calls nothing for another key', async () => {
    const useEscapeDismiss = await loadHook();
    const onDismiss = vi.fn<() => void>();
    renderHook(() => {
      useEscapeDismiss(onDismiss, true);
    });

    const event = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);

    expect(onDismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('calls only the last registered dismisser, and the earlier one once the later one is gone', async () => {
    const useEscapeDismiss = await loadHook();
    const lower = vi.fn<() => void>();
    const upper = vi.fn<() => void>();
    renderHook(() => {
      useEscapeDismiss(lower, true);
    });
    const upperHook = renderHook(() => {
      useEscapeDismiss(upper, true);
    });

    pressEscape();
    expect(upper).toHaveBeenCalledTimes(1);
    expect(lower).not.toHaveBeenCalled();

    upperHook.unmount();
    pressEscape();
    expect(lower).toHaveBeenCalledTimes(1);
  });

  it('calls the latest callback of the lower dismisser without moving it above the upper one', async () => {
    const useEscapeDismiss = await loadHook();
    const firstLower = vi.fn<() => void>();
    const nextLower = vi.fn<() => void>();
    const upper = vi.fn<() => void>();
    const lowerHook = renderHook(
      (props: { onDismiss: () => void }) => {
        useEscapeDismiss(props.onDismiss, true);
      },
      { initialProps: { onDismiss: firstLower } },
    );
    const upperHook = renderHook(() => {
      useEscapeDismiss(upper, true);
    });

    lowerHook.rerender({ onDismiss: nextLower });
    pressEscape();
    expect(upper).toHaveBeenCalledTimes(1);
    expect(nextLower).not.toHaveBeenCalled();

    upperHook.unmount();
    pressEscape();
    expect(nextLower).toHaveBeenCalledTimes(1);
    expect(firstLower).not.toHaveBeenCalled();
  });

  it('calls an inactive dismisser only once it becomes active', async () => {
    const useEscapeDismiss = await loadHook();
    const onDismiss = vi.fn<() => void>();
    const { rerender } = renderHook(
      (props: { isActive: boolean }) => {
        useEscapeDismiss(onDismiss, props.isActive);
      },
      { initialProps: { isActive: false } },
    );

    pressEscape();
    expect(onDismiss).not.toHaveBeenCalled();

    rerender({ isActive: true });
    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);

    rerender({ isActive: false });
    pressEscape();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls nothing after the last dismisser unmounts', async () => {
    const useEscapeDismiss = await loadHook();
    const onDismiss = vi.fn<() => void>();
    const { unmount } = renderHook(() => {
      useEscapeDismiss(onDismiss, true);
    });

    unmount();
    const event = pressEscape();

    expect(onDismiss).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it('lets the event reach a bubble-phase listener on the document, already marked as taken', async () => {
    const useEscapeDismiss = await loadHook();
    const seen = vi.fn<(event: KeyboardEvent) => void>();
    document.addEventListener('keydown', seen);
    renderHook(() => {
      useEscapeDismiss(vi.fn(), true);
    });

    pressEscape();
    document.removeEventListener('keydown', seen);

    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen.mock.calls[0]?.[0].defaultPrevented).toBe(true);
  });

  it('registers one capture-phase keydown listener on the document for any number of active dismissers, and removes that same listener with the last one', async () => {
    const useEscapeDismiss = await loadHook();
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const first = renderHook(() => {
      useEscapeDismiss(vi.fn(), true);
    });
    const second = renderHook(() => {
      useEscapeDismiss(vi.fn(), true);
    });

    const keydownAdds = add.mock.calls.filter(([type]) => type === 'keydown');
    expect(keydownAdds).toHaveLength(1);
    expect(keydownAdds[0]?.[2]).toBe(true);

    second.unmount();
    expect(
      remove.mock.calls.filter(([type]) => type === 'keydown'),
    ).toHaveLength(0);

    first.unmount();
    const keydownRemoves = remove.mock.calls.filter(
      ([type]) => type === 'keydown',
    );
    expect(keydownRemoves).toHaveLength(1);
    expect(keydownRemoves[0]?.[1]).toBe(keydownAdds[0]?.[1]);
    expect(keydownRemoves[0]?.[2]).toBe(true);
    add.mockRestore();
    remove.mockRestore();
  });
});
