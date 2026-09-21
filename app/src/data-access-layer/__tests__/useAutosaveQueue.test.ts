import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mergeUpdate } from '../mergeUpdate';
import { useAutosaveQueue } from '../useAutosaveQueue';

type Patch = { name?: string };

describe('useAutosaveQueue', () => {
  const write = vi.fn<(key: string, pending: Patch) => void>();

  // A new inline `write` per render, as every hook passes it, so a holder keyed on `write` would rebuild the queue on a re-render.
  const renderQueue = () =>
    renderHook(() =>
      useAutosaveQueue<Patch>(mergeUpdate, (key, pending) => {
        write(key, pending);
      }),
    );

  beforeEach(() => {
    vi.useFakeTimers();
    write.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps one queue across re-renders and writes nothing on a re-render', () => {
    const { result, rerender } = renderQueue();
    result.current.schedule('entity-1', { name: 'a' });
    const queueBeforeRerender = result.current;

    rerender();

    expect(result.current).toBe(queueBeforeRerender);
    expect(write).not.toHaveBeenCalled();
  });

  it('writes the pending edit once when the hook unmounts', () => {
    const { result, unmount } = renderQueue();
    result.current.schedule('entity-1', { name: 'a' });

    unmount();

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('entity-1', { name: 'a' });
  });
});
