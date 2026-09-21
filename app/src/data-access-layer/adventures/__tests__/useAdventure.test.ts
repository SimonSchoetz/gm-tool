import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Adventure } from '@db/adventure';
import type * as service from '@services/adventureService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { adventureKeys } from '../adventureKeys';
import { useAdventure } from '../useAdventure';

const getAdventureById = vi.hoisted(() =>
  vi.fn<typeof service.getAdventureById>(),
);
const updateAdventure = vi.hoisted(() =>
  vi.fn<typeof service.updateAdventure>(),
);

vi.mock('@services/adventureService', () => ({
  getAdventureById,
  updateAdventure,
}));

const adventureRow = (id: string): Adventure => ({
  id,
  name: null,
  description: null,
  image_id: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

const renderAdventure = async () => {
  const rendered = renderHookWithQueryClient(
    ({ adventureId }: { adventureId: string }) => useAdventure(adventureId),
    { initialProps: { adventureId: 'adventure-1' } },
  );
  await settle(0);
  return rendered;
};

describe('useAdventure', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getAdventureById.mockImplementation((id) =>
      Promise.resolve(adventureRow(id)),
    );
    updateAdventure.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled adventure and its data after a re-render for another adventure', async () => {
    const { result, rerender } = await renderAdventure();

    act(() => {
      result.current.updateAdventure({ name: 'n' });
    });
    rerender({ adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateAdventure).toHaveBeenCalledTimes(1);
    expect(updateAdventure).toHaveBeenCalledWith('adventure-1', { name: 'n' });
  });

  it('invalidates the adventure list and the scheduled adventure after a re-render', async () => {
    const { result, rerender, invalidateQueries } = await renderAdventure();

    act(() => {
      result.current.updateAdventure({ name: 'n' });
    });
    rerender({ adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: adventureKeys.list(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: adventureKeys.detail('adventure-1'),
    });
  });

  it("keeps an earlier edit's value when a later edit to the same adventure leaves it undefined", async () => {
    const { result } = await renderAdventure();

    act(() => {
      result.current.updateAdventure({ description: 'kept' });
    });
    act(() => {
      result.current.updateAdventure({ name: 'n', description: undefined });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateAdventure).toHaveBeenCalledTimes(1);
    expect(updateAdventure).toHaveBeenCalledWith('adventure-1', {
      description: 'kept',
      name: 'n',
    });
  });
});
