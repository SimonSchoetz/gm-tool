import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterShownItem } from '../EncounterShownItem';

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

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

describe('EncounterShownItem', () => {
  beforeEach(() => {
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getQueueItems.mockResolvedValue([
      ...['Goblin', 'Orc'].map((name, index) =>
        buildEncounterQueueItem({
          id: `item-${index + 1}`,
          name,
          sequence_number: 1,
          sort_order: index,
        }),
      ),
      buildEncounterQueueItem({
        id: 'event-1',
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name: 'Lair action',
        sort_order: 2,
      }),
    ]);
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
  });

  it('shows the hint and no combatant fields when nothing is shown', () => {
    render(<EncounterShownItem shownItemId={null} />, {
      wrapper: TanstackQueryClientProvider,
    });

    expect(
      screen.getByText('Click an entry in the queue to show it here.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Combatant name' }),
    ).not.toBeInTheDocument();
  });

  it('replaces the former combatant with the newly shown one', async () => {
    const { rerender } = render(<EncounterShownItem shownItemId='item-1' />, {
      wrapper: TanstackQueryClientProvider,
    });
    await screen.findByDisplayValue('Goblin');

    rerender(<EncounterShownItem shownItemId='item-2' />);
    await screen.findByDisplayValue('Orc');

    expect(
      screen.getAllByRole('textbox', { name: 'Combatant name' }),
    ).toHaveLength(1);
    expect(screen.queryByDisplayValue('Goblin')).not.toBeInTheDocument();
  });

  it('shows the event name field with the stored name for an event and no combatant name field, and the reverse for a combatant', async () => {
    const { rerender } = render(<EncounterShownItem shownItemId='event-1' />, {
      wrapper: TanstackQueryClientProvider,
    });

    expect(await screen.findByDisplayValue('Lair action')).toBe(
      screen.getByRole('textbox', { name: 'Event name' }),
    );
    expect(
      screen.queryByRole('textbox', { name: 'Combatant name' }),
    ).not.toBeInTheDocument();

    rerender(<EncounterShownItem shownItemId='item-1' />);

    expect(
      await screen.findByRole('textbox', { name: 'Combatant name' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Event name' }),
    ).not.toBeInTheDocument();
  });
});
