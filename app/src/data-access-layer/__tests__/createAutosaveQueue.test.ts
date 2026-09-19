import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTOSAVE_DELAY_MS, createAutosaveQueue } from '../createAutosaveQueue';

type Patch = { name?: string; description?: string };

const merge = (pending: Patch, patch: Patch): Patch => ({
  ...pending,
  ...patch,
});

describe('createAutosaveQueue', () => {
  const write = vi.fn<(key: string, pending: Patch) => void>();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the merged patch once, a full delay after the last schedule for a key', () => {
    const queue = createAutosaveQueue(merge, write);

    queue.schedule('x', { name: 'a' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS / 2);
    queue.schedule('x', { description: 'b' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);

    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('x', {
      name: 'a',
      description: 'b',
    });
  });

  it('writes a single patch exactly one delay after it was scheduled', () => {
    const queue = createAutosaveQueue(merge, write);

    queue.schedule('x', { name: 'a' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);

    expect(write).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('x', { name: 'a' });
  });

  it('keeps a separate timer per key, so a later edit to one key does not delay another', () => {
    const queue = createAutosaveQueue(merge, write);

    queue.schedule('a', { name: 'for a' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS / 2);
    queue.schedule('b', { name: 'for b' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS / 2);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('a', { name: 'for a' });

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS / 2);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('b', { name: 'for b' });
  });

  it('writes each key its own patch and never merges patches across keys', () => {
    const queue = createAutosaveQueue(merge, write);

    queue.schedule('a', { name: 'for a' });
    queue.schedule('b', { description: 'for b' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenCalledWith('a', { name: 'for a' });
    expect(write).toHaveBeenCalledWith('b', { description: 'for b' });
  });

  it('writes every pending patch at once on flushAll and nothing more when the delay passes', () => {
    const queue = createAutosaveQueue(merge, write);
    queue.schedule('a', { name: 'for a' });
    queue.schedule('b', { name: 'for b' });

    queue.flushAll();

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenCalledWith('a', { name: 'for a' });
    expect(write).toHaveBeenCalledWith('b', { name: 'for b' });

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);

    expect(write).toHaveBeenCalledTimes(2);
  });

  it('writes nothing when flushAll finds nothing pending', () => {
    const queue = createAutosaveQueue(merge, write);

    queue.flushAll();

    expect(write).not.toHaveBeenCalled();
  });

  it('starts a key over with an empty patch once its previous patch was written', () => {
    const queue = createAutosaveQueue(merge, write);
    queue.schedule('x', { name: 'a' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    write.mockClear();

    queue.schedule('x', { description: 'b' });
    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('x', { description: 'b' });
  });

  it('leaves a patch that a write schedules for its own key to the timer of that key, not flushed again in the same pass', () => {
    let scheduledFromWrite = false;
    const queue = createAutosaveQueue<Patch>(merge, (key, pending) => {
      write(key, pending);
      if (!scheduledFromWrite) {
        scheduledFromWrite = true;
        queue.schedule(key, { description: 'b' });
      }
    });
    queue.schedule('x', { name: 'a' });

    queue.flushAll();

    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('x', { name: 'a' });

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('x', { description: 'b' });
  });

  it('keeps a patch that a write schedules for another key still waiting in the same flush', () => {
    let scheduledFromWrite = false;
    const queue = createAutosaveQueue<Patch>(merge, (key, pending) => {
      write(key, pending);
      if (!scheduledFromWrite) {
        scheduledFromWrite = true;
        queue.schedule('b', { description: 'late' });
      }
    });
    queue.schedule('a', { name: 'for a' });
    queue.schedule('b', { name: 'for b' });

    queue.flushAll();

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenNthCalledWith(1, 'a', { name: 'for a' });
    expect(write).toHaveBeenNthCalledWith(2, 'b', {
      name: 'for b',
      description: 'late',
    });

    vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);

    expect(write).toHaveBeenCalledTimes(2);
  });
});
