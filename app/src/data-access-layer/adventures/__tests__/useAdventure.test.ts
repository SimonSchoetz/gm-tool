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

const deleteAdventure = vi.hoisted(() =>
  vi.fn<typeof service.deleteAdventure>(),
);
const removeAdventureImage = vi.hoisted(() =>
  vi.fn<typeof service.removeAdventureImage>(),
);

vi.mock('@services/adventureService', () => ({
  getAdventureById,
  updateAdventure,
  deleteAdventure,
  removeAdventureImage,
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

describe('useAdventure data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getAdventureById.mockImplementation((id) =>
      Promise.resolve(adventureRow(id)),
    );
    updateAdventure.mockReset().mockResolvedValue(undefined);
    deleteAdventure.mockReset().mockResolvedValue(undefined);
    removeAdventureImage.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no adventure and loading until it has loaded, then the loaded adventure', async () => {
    const { result } = renderHookWithQueryClient(
      ({ adventureId }: { adventureId: string }) => useAdventure(adventureId),
      { initialProps: { adventureId: 'adventure-1' } },
    );

    expect(result.current.adventure).toBeNull();
    expect(result.current.loading).toBe(true);

    await settle(0);

    expect(result.current.adventure?.id).toBe('adventure-1');
    expect(result.current.loading).toBe(false);
  });

  it('shows an edit at once in the cached adventure, without the chosen file path', async () => {
    const { result } = await renderAdventure();

    act(() => {
      result.current.updateAdventure({
        name: 'Renamed',
        imgFilePath: '/pick/map.png',
      });
    });
    await settle(0);

    expect(result.current.adventure?.name).toBe('Renamed');
    expect(result.current.adventure).not.toHaveProperty('imgFilePath');
  });

  it('schedules no save and changes nothing before the adventure has loaded', async () => {
    getAdventureById.mockImplementation(
      () => new Promise<Adventure>(() => undefined),
    );
    const { result, queryClient } = renderHookWithQueryClient(
      ({ adventureId }: { adventureId: string }) => useAdventure(adventureId),
      { initialProps: { adventureId: 'adventure-1' } },
    );

    act(() => {
      result.current.updateAdventure({ name: 'x' });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateAdventure).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData(adventureKeys.detail('adventure-1')),
    ).toBeUndefined();
  });

  it('deletes the adventure and invalidates the adventure list', async () => {
    const { result, invalidateQueries } = await renderAdventure();

    await act(async () => {
      await result.current.deleteAdventure();
    });

    expect(deleteAdventure).toHaveBeenCalledWith('adventure-1');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: adventureKeys.list(),
    });
  });

  it('removes the adventure image and invalidates the adventure and the list', async () => {
    const { result, invalidateQueries } = await renderAdventure();

    await act(async () => {
      await result.current.removeAdventureImage();
    });

    expect(removeAdventureImage).toHaveBeenCalledWith('adventure-1');
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: adventureKeys.detail('adventure-1') }],
      [{ queryKey: adventureKeys.list() }],
    ]);
  });
});
