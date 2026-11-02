import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as service from '@services/encounterService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { encounterKeys } from '../encounterKeys';
import { useEncounter } from '../useEncounter';

const getEncounterById = vi.hoisted(() =>
  vi.fn<typeof service.getEncounterById>(),
);
const updateEncounter = vi.hoisted(() =>
  vi.fn<typeof service.updateEncounter>(),
);
const removeEncounterImage = vi.hoisted(() =>
  vi.fn<typeof service.removeEncounterImage>(),
);

vi.mock('@services/encounterService', () => ({
  getEncounterById,
  updateEncounter,
  removeEncounterImage,
}));

const renderEncounter = async () => {
  const rendered = renderHookWithQueryClient(
    ({
      encounterId,
      adventureId,
    }: {
      encounterId: string;
      adventureId: string;
    }) => useEncounter(encounterId, adventureId),
    {
      initialProps: { encounterId: 'encounter-1', adventureId: 'adventure-1' },
    },
  );
  await settle(0);
  return rendered;
};

describe('useEncounter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getEncounterById.mockImplementation((id) =>
      Promise.resolve(buildEncounter({ id })),
    );
    updateEncounter.mockResolvedValue(undefined);
    removeEncounterImage.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled encounter and its data after a re-render for another encounter', async () => {
    const { result, rerender } = await renderEncounter();

    act(() => {
      result.current.updateEncounter({ name: 'n' });
    });
    rerender({ encounterId: 'encounter-2', adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateEncounter).toHaveBeenCalledTimes(1);
    expect(updateEncounter).toHaveBeenCalledWith('encounter-1', { name: 'n' });
  });

  it("invalidates the scheduled encounter and its adventure's list after a re-render for another adventure", async () => {
    const { result, rerender, invalidateQueries } = await renderEncounter();

    act(() => {
      result.current.updateEncounter({ name: 'n' });
    });
    rerender({ encounterId: 'encounter-2', adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.detail('encounter-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.list('adventure-1'),
    });
  });

  it("keeps an earlier edit's value when a later edit to the same encounter leaves it undefined", async () => {
    const { result } = await renderEncounter();

    act(() => {
      result.current.updateEncounter({ description: 'kept' });
    });
    act(() => {
      result.current.updateEncounter({ name: 'n', description: undefined });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateEncounter).toHaveBeenCalledTimes(1);
    expect(updateEncounter).toHaveBeenCalledWith('encounter-1', {
      description: 'kept',
      name: 'n',
    });
  });

  it('writes a scheduled edit that carries a chosen file whole, under the scheduled encounter, after a re-render for another encounter', async () => {
    const { result, rerender } = await renderEncounter();

    act(() => {
      result.current.updateEncounter({
        imgFilePath: '/pick/map.png',
        image_id: null,
      });
    });
    rerender({ encounterId: 'encounter-2', adventureId: 'adventure-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateEncounter).toHaveBeenCalledTimes(1);
    expect(updateEncounter).toHaveBeenCalledWith('encounter-1', {
      imgFilePath: '/pick/map.png',
      image_id: null,
    });
  });

  it('caches the edit without the chosen file path', async () => {
    const { result, queryClient } = await renderEncounter();

    act(() => {
      result.current.updateEncounter({
        imgFilePath: '/pick/map.png',
        description: 'd',
      });
    });

    expect(
      queryClient.getQueryData(encounterKeys.detail('encounter-1')),
    ).toEqual(buildEncounter({ id: 'encounter-1', description: 'd' }));
  });

  it("removes the image of the encounter the hook was built for and invalidates that encounter's detail and its adventure's list", async () => {
    const { result, invalidateQueries } = await renderEncounter();

    await act(() => result.current.removeEncounterImage());

    expect(removeEncounterImage).toHaveBeenCalledWith('encounter-1');
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.detail('encounter-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: encounterKeys.list('adventure-1'),
    });
  });
});
