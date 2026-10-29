import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { ROUTE_ENCOUNTER_ID } from '@/__tests__/support/encounterRouteParams';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterCombatantActionsTab } from '../EncounterCombatantActionsTab';

const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getAllBaseEntities>(),
);
const getEncounterById = vi.hoisted(() =>
  vi.fn<typeof encounterService.getEncounterById>(),
);
const getLogEntries = vi.hoisted(() =>
  vi.fn<typeof logEntryService.getLogEntries>(),
);
const recordLogEntry = vi.hoisted(() =>
  vi.fn<typeof logEntryService.recordLogEntry>(),
);
const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({
  getLogEntries,
  recordLogEntry,
}));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const ITEM_ID = 'item-1';

const arrange = ({
  startingMaxHp = 10,
  logEntries = [],
}: {
  startingMaxHp?: number | null;
  logEntries?: EncounterLogEntry[];
} = {}) => {
  getEncounterById.mockResolvedValue(buildEncounter());
  getQueueItems.mockResolvedValue([
    buildEncounterQueueItem({
      id: ITEM_ID,
      name: 'Goblin',
      starting_max_hp: startingMaxHp,
    }),
  ]);
  getLogEntries.mockResolvedValue(logEntries);
  getAllBaseEntities.mockResolvedValue([]);
};

const renderTab = async (selectedId: string | null = ITEM_ID) => {
  const rendered = render(
    <EncounterCombatantActionsTab selectedId={selectedId} />,
    {
      wrapper: TanstackQueryClientProvider,
    },
  );
  if (selectedId !== null) await screen.findByText('Goblin');
  return rendered;
};

const withDeferredRecord = () => {
  let release: (() => void) | null = null;
  recordLogEntry.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    release?.();
  };
};

const amountField = () => screen.getByRole('spinbutton', { name: 'Amount' });
const button = (name: string) => screen.getByRole('button', { name });

describe('EncounterCombatantActionsTab', () => {
  beforeEach(() => {
    queryClient.clear();
    recordLogEntry.mockReset().mockResolvedValue();
    arrange();
  });

  it('records nothing when Enter is pressed in the amount field', async () => {
    const user = userEvent.setup();
    await renderTab();

    await user.type(amountField(), '5{Enter}');

    expect(recordLogEntry).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: 'Damage',
      kind: 'damage',
      payload: { targets: [{ queueItemId: ITEM_ID, amount: 5 }] },
    },
    {
      label: 'Heal',
      kind: 'heal',
      payload: { targets: [{ queueItemId: ITEM_ID, amount: 5 }] },
    },
    {
      label: 'Set temp HP',
      kind: 'temp-hp',
      payload: { targets: [{ queueItemId: ITEM_ID, value: 5 }] },
    },
    {
      label: 'Set max HP',
      kind: 'max-hp',
      payload: { targets: [{ queueItemId: ITEM_ID, value: 5 }] },
    },
    {
      label: 'Mark defeated',
      kind: 'defeated',
      payload: { queueItemIds: [ITEM_ID] },
    },
    { label: 'Remove', kind: 'removed', payload: { queueItemIds: [ITEM_ID] } },
  ])(
    'records a $kind entry for the selected combatant when $label is clicked',
    async ({ label, kind, payload }) => {
      const user = userEvent.setup();
      await renderTab();
      await user.type(amountField(), '5');

      await user.click(button(label));

      await waitFor(() => {
        expect(recordLogEntry).toHaveBeenCalledWith(
          ROUTE_ENCOUNTER_ID,
          kind,
          payload,
        );
      });
    },
  );

  it('records an undefeated entry when Unmark defeated is clicked on a defeated combatant', async () => {
    arrange({
      logEntries: [
        buildEncounterLogEntry('defeated', { queueItemIds: [ITEM_ID] }),
      ],
    });
    const user = userEvent.setup();
    await renderTab();
    await waitFor(() => {
      expect(button('Unmark defeated')).toBeEnabled();
    });

    await user.click(button('Unmark defeated'));

    await waitFor(() => {
      expect(recordLogEntry).toHaveBeenCalledWith(
        ROUTE_ENCOUNTER_ID,
        'undefeated',
        { queueItemIds: [ITEM_ID] },
      );
    });
  });

  it('keeps the amount after an action and after the selection passes through empty', async () => {
    const user = userEvent.setup();
    const { rerender } = await renderTab();
    await user.type(amountField(), '5');
    await user.click(button('Damage'));
    await waitFor(() => {
      expect(recordLogEntry).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(button('Damage')).toBeEnabled();
    });

    expect(amountField()).toHaveValue(5);

    rerender(<EncounterCombatantActionsTab selectedId={null} />);
    expect(
      screen.getByText('Select a combatant in the queue.'),
    ).toBeInTheDocument();
    rerender(<EncounterCombatantActionsTab selectedId={ITEM_ID} />);

    expect(amountField()).toHaveValue(5);
  });

  it('labels the empty amount field with an Amount placeholder', async () => {
    await renderTab();

    expect(screen.getByPlaceholderText('Amount')).toBe(amountField());
  });

  it('enables Damage once an amount is typed', async () => {
    const user = userEvent.setup();
    await renderTab();

    expect(button('Damage')).toBeDisabled();

    await user.type(amountField(), '5');

    expect(button('Damage')).toBeEnabled();
  });

  it('disables every button while a write is pending', async () => {
    const releaseWrite = withDeferredRecord();
    const user = userEvent.setup();
    await renderTab();
    await user.type(amountField(), '5');

    await user.click(button('Damage'));

    await waitFor(() => {
      expect(
        screen
          .getAllByRole('button')
          .every((candidate) => candidate.hasAttribute('disabled')),
      ).toBe(true);
    });
    releaseWrite();
  });

  it('shows a hint while nothing is selected', async () => {
    await renderTab(null);

    expect(
      screen.getByText('Select a combatant in the queue.'),
    ).toBeInTheDocument();
  });

  it('says HP is not set for a combatant without HP and disables Damage and Heal', async () => {
    arrange({ startingMaxHp: null });
    const user = userEvent.setup();
    await renderTab();
    await user.type(amountField(), '5');

    expect(
      screen.getByText('HP is not set. Set max HP to track it.'),
    ).toBeInTheDocument();
    expect(button('Damage')).toBeDisabled();
    expect(button('Heal')).toBeDisabled();
    expect(button('Set max HP')).toBeEnabled();
  });
});
