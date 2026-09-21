import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Encounter } from '@db/encounter';
import type * as service from '@services/encounterService';
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

vi.mock('@services/encounterService', () => ({
  getEncounterById,
  updateEncounter,
}));

const encounterRow = (id: string): Encounter => ({
  id,
  adventure_id: 'adventure-1',
  name: null,
  description: null,
  pinned_order: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

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
      Promise.resolve(encounterRow(id)),
    );
    updateEncounter.mockResolvedValue(undefined);
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
});
