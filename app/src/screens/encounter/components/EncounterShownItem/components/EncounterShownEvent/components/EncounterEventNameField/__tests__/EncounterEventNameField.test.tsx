import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterEventNameField } from '../EncounterEventNameField';

const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);
const updateQueueItem = vi.hoisted(() =>
  vi.fn<typeof queueService.updateQueueItem>(),
);

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  updateQueueItem,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const EVENT_ID = 'event-1';

const queueWithEvent = (name: string | null) => [
  buildEncounterQueueItem({
    id: EVENT_ID,
    kind: 'event',
    base_entity_id: null,
    sequence_number: null,
    name,
  }),
];

const renderField = async (shownItemId = EVENT_ID) => {
  render(<EncounterEventNameField shownItemId={shownItemId} />, {
    wrapper: TanstackQueryClientProvider,
  });
  return screen.findByRole('textbox', { name: 'Event name' });
};

const flushSave = () => act(() => vi.runOnlyPendingTimersAsync());

describe('EncounterEventNameField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    queryClient.clear();
    getQueueItems.mockResolvedValue(queueWithEvent('Lair action'));
    updateQueueItem.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the typed name trimmed for that item once after the delay, never as custom_name', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await user.type(field, '  Reinforcements ');
    await flushSave();

    expect(updateQueueItem).toHaveBeenCalledTimes(1);
    expect(updateQueueItem).toHaveBeenCalledWith(EVENT_ID, {
      name: 'Reinforcements',
    });
  });

  it('saves null for an emptied field, keeps it empty behind the Untitled Event placeholder and fills nothing in on leaving it', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await flushSave();

    expect(updateQueueItem).toHaveBeenCalledWith(EVENT_ID, { name: null });
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('placeholder', 'Untitled Event');

    await user.tab();

    expect(field).toHaveValue('');
  });

  it('saves null for a spaces-only name and takes the focus out of the field on Enter', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const field = await renderField();

    await user.clear(field);
    await user.type(field, '   ');
    await flushSave();

    expect(updateQueueItem).toHaveBeenLastCalledWith(EVENT_ID, { name: null });

    await user.type(field, '{Enter}');

    expect(field).not.toHaveFocus();
  });

  it('renders no field for an unknown item', async () => {
    render(<EncounterEventNameField shownItemId='missing' />, {
      wrapper: TanstackQueryClientProvider,
    });
    await waitFor(() => {
      expect(getQueueItems).toHaveBeenCalled();
    });
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(
      screen.queryByRole('textbox', { name: 'Event name' }),
    ).not.toBeInTheDocument();
  });
});
