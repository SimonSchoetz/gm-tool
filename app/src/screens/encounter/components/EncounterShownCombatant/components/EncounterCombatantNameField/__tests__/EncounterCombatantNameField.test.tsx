import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterCombatantNameField } from '../EncounterCombatantNameField';

const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getAllBaseEntities>(),
);
const getEncounterById = vi.hoisted(() =>
  vi.fn<typeof encounterService.getEncounterById>(),
);
const getLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryService.getLogEntries>(),
);
const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);
const updateQueueItem = vi.hoisted(() =>
  vi.fn<typeof queueService.updateQueueItem>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  updateQueueItem,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const THIRD_ID = 'item-3';

const queueOfThree = (customNames: Record<string, string | null> = {}) =>
  [1, 2, 3].map((number) =>
    buildEncounterQueueItem({
      id: `item-${number}`,
      name: 'Goblin',
      custom_name: customNames[`item-${number}`] ?? null,
      sequence_number: number,
      sort_order: number,
    }),
  );

const renderField = async (shownItemId = THIRD_ID) => {
  render(<EncounterCombatantNameField shownItemId={shownItemId} />, {
    wrapper: TanstackQueryClientProvider,
  });
  return screen.findByRole('textbox', { name: 'Combatant name' });
};

const flushSave = () => act(() => vi.runOnlyPendingTimersAsync());

describe('EncounterCombatantNameField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getQueueItems.mockResolvedValue(queueOfThree());
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
    updateQueueItem.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the name the queue shows for the shown combatant', async () => {
    const field = await renderField();

    expect(field).toHaveValue('Goblin 3');
  });

  it('saves a typed name trimmed, for that item only, once after the delay', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await user.type(field, '  Boss ');
    await flushSave();

    expect(updateQueueItem).toHaveBeenCalledTimes(1);
    expect(updateQueueItem).toHaveBeenCalledWith(THIRD_ID, {
      custom_name: 'Boss',
    });
  });

  it('saves null for an emptied field and shows the automatic name again on leaving it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await flushSave();
    expect(updateQueueItem).toHaveBeenCalledWith(THIRD_ID, {
      custom_name: null,
    });
    expect(field).toHaveValue('');

    await user.tab();

    expect(field).toHaveValue('Goblin 3');
  });

  it('saves null for exactly the automatic name', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await user.type(field, 'Goblin 3');
    await flushSave();

    expect(updateQueueItem).toHaveBeenCalledTimes(1);
    expect(updateQueueItem).toHaveBeenCalledWith(THIRD_ID, {
      custom_name: null,
    });
  });

  it('keeps a rename in the field when leaving it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();
    await user.clear(field);
    await user.type(field, 'Boss');

    await user.tab();

    expect(field).toHaveValue('Boss');
  });

  it('takes focus out of the field on Enter and restores the shown name after spaces-only text', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();
    await user.clear(field);
    await user.type(field, '   ');

    await user.keyboard('{Enter}');

    expect(field).not.toHaveFocus();
    expect(field).toHaveValue('Goblin 3');
  });

  it('renders nothing for a combatant that is not in the queue', async () => {
    render(<EncounterCombatantNameField shownItemId='missing' />, {
      wrapper: TanstackQueryClientProvider,
    });
    await waitFor(() => {
      expect(getQueueItems).toHaveBeenCalled();
    });
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(
      screen.queryByRole('textbox', { name: 'Combatant name' }),
    ).not.toBeInTheDocument();
  });

  it('adopts a name changed elsewhere once the field has been left', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();
    await user.click(field);
    await user.tab();

    getQueueItems.mockResolvedValue(
      queueOfThree({ [THIRD_ID]: 'Renamed on another device' }),
    );
    await act(() => queryClient.invalidateQueries());
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(field).toHaveValue('Renamed on another device');
  });

  it('renders nothing for the id of an event', async () => {
    getQueueItems.mockResolvedValue([
      buildEncounterQueueItem({
        id: 'event-1',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: 'Lair action',
      }),
    ]);
    render(<EncounterCombatantNameField shownItemId='event-1' />, {
      wrapper: TanstackQueryClientProvider,
    });
    await waitFor(() => {
      expect(getAllBaseEntities).toHaveBeenCalled();
    });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(
      screen.queryByRole('textbox', { name: 'Combatant name' }),
    ).not.toBeInTheDocument();
  });
});
