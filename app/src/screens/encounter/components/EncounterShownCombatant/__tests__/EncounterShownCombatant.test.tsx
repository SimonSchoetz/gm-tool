import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterShownCombatant } from '../EncounterShownCombatant';

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

describe('EncounterShownCombatant', () => {
  beforeEach(() => {
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getQueueItems.mockResolvedValue(
      ['Goblin', 'Orc'].map((name, index) =>
        buildEncounterQueueItem({
          id: `item-${index + 1}`,
          name,
          sequence_number: 1,
          sort_order: index,
        }),
      ),
    );
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
  });

  it('replaces the former combatant with the newly shown one', async () => {
    const { rerender } = render(
      <EncounterShownCombatant shownItemId='item-1' />,
      {
        wrapper: TanstackQueryClientProvider,
      },
    );
    await screen.findByDisplayValue('Goblin');

    rerender(<EncounterShownCombatant shownItemId='item-2' />);
    await screen.findByDisplayValue('Orc');

    expect(
      screen.getAllByRole('textbox', { name: 'Combatant name' }),
    ).toHaveLength(1);
    expect(screen.queryByDisplayValue('Goblin')).not.toBeInTheDocument();
  });
});
