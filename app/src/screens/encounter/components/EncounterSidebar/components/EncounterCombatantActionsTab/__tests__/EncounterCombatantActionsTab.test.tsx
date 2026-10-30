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
const OTHER_ID = 'item-2';
const THIRD_ID = 'item-3';

type Combatant = { id: string; name: string; maxHp: number | null };

const GOBLIN: Combatant = { id: ITEM_ID, name: 'Goblin', maxHp: 10 };
const ORC: Combatant = { id: OTHER_ID, name: 'Orc', maxHp: 20 };
const TROLL: Combatant = { id: THIRD_ID, name: 'Troll', maxHp: 30 };

type QueueEvent = { id: string; name: string };

const LAIR: QueueEvent = { id: 'event-1', name: 'Lair action' };
const REINFORCEMENTS: QueueEvent = { id: 'event-2', name: 'Reinforcements' };

const arrange = ({
  combatants = [GOBLIN],
  events = [],
  logEntries = [],
}: {
  combatants?: Combatant[];
  events?: QueueEvent[];
  logEntries?: EncounterLogEntry[];
} = {}) => {
  getEncounterById.mockResolvedValue(buildEncounter());
  getQueueItems.mockResolvedValue([
    ...combatants.map(({ id, name, maxHp }, index) =>
      buildEncounterQueueItem({
        id,
        name,
        starting_max_hp: maxHp,
        sort_order: index,
      }),
    ),
    ...events.map(({ id, name }, index) =>
      buildEncounterQueueItem({
        id,
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name,
        sort_order: combatants.length + index,
      }),
    ),
  ]);
  getLogEntries.mockResolvedValue(logEntries);
  getAllBaseEntities.mockResolvedValue([]);
};

const renderTab = async (
  selectedIds: string[] = [ITEM_ID],
  readyText = 'Goblin',
) => {
  const rendered = render(
    <EncounterCombatantActionsTab selectedIds={selectedIds} />,
    {
      wrapper: TanstackQueryClientProvider,
    },
  );
  if (selectedIds.length > 0) await screen.findByText(readyText);
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

const amountField = (name = 'Goblin') =>
  screen.getByRole('spinbutton', { name: `Amount for ${name}` });
const sharedField = () =>
  screen.getByRole('spinbutton', { name: 'Shared amount' });
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

    rerender(<EncounterCombatantActionsTab selectedIds={[]} />);
    expect(
      screen.getByText('Select a combatant in the queue.'),
    ).toBeInTheDocument();
    rerender(<EncounterCombatantActionsTab selectedIds={[ITEM_ID]} />);

    expect(amountField()).toHaveValue(5);
  });

  it('labels the empty amount field with an Amount placeholder', async () => {
    await renderTab();

    expect(screen.getByPlaceholderText('Amount')).toBe(amountField());
  });

  it.each(['Damage', 'Heal', 'Set temp HP', 'Set max HP'])(
    'enables %s once an amount is typed',
    async (label) => {
      const user = userEvent.setup();
      await renderTab();

      expect(button(label)).toBeDisabled();

      await user.type(amountField(), '5');

      expect(button(label)).toBeEnabled();
    },
  );

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

  it('shows no events line when no event is selected', async () => {
    arrange({ events: [LAIR] });
    await renderTab();

    expect(screen.queryByText(/Remove also removes/)).not.toBeInTheDocument();
  });

  it('shows a hint while nothing is selected', async () => {
    await renderTab([]);

    expect(
      screen.getByText('Select a combatant in the queue.'),
    ).toBeInTheDocument();
  });

  it('says HP is not set for a combatant without HP and disables Damage and Heal', async () => {
    arrange({ combatants: [{ ...GOBLIN, maxHp: null }] });
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

  describe('with several combatants selected', () => {
    const SEVERAL = [ITEM_ID, OTHER_ID, THIRD_ID];

    beforeEach(() => {
      arrange({ combatants: [GOBLIN, ORC, TROLL] });
    });

    it('shows the shared field from two selected on and not for one', async () => {
      const { rerender } = await renderTab(SEVERAL);

      expect(sharedField()).toBeInTheDocument();
      expect(sharedField()).toHaveAttribute('placeholder', 'Amount for all');

      rerender(<EncounterCombatantActionsTab selectedIds={[ITEM_ID]} />);

      expect(
        screen.queryByRole('spinbutton', { name: 'Shared amount' }),
      ).not.toBeInTheDocument();
    });

    it('fills every row from the shared field and lets a row keep its own text', async () => {
      const user = userEvent.setup();
      await renderTab(SEVERAL);

      await user.type(sharedField(), '4');
      expect(amountField('Goblin')).toHaveValue(4);
      expect(amountField('Orc')).toHaveValue(4);
      expect(amountField('Troll')).toHaveValue(4);

      await user.clear(amountField('Orc'));
      await user.type(amountField('Orc'), '9');
      expect(amountField('Orc')).toHaveValue(9);
      expect(amountField('Goblin')).toHaveValue(4);
    });

    it('writes one entry with each row’s own amount when Damage is clicked', async () => {
      const user = userEvent.setup();
      await renderTab(SEVERAL);
      await user.type(sharedField(), '4');
      await user.clear(amountField('Orc'));
      await user.type(amountField('Orc'), '9');

      await user.click(button('Damage'));

      await waitFor(() => {
        expect(recordLogEntry.mock.calls).toEqual([
          [
            ROUTE_ENCOUNTER_ID,
            'damage',
            {
              targets: [
                { queueItemId: ITEM_ID, amount: 4 },
                { queueItemId: OTHER_ID, amount: 9 },
                { queueItemId: THIRD_ID, amount: 4 },
              ],
            },
          ],
        ]);
      });
    });

    it('leaves a combatant without HP out of Damage and does not wait for its amount', async () => {
      arrange({ combatants: [GOBLIN, { ...ORC, maxHp: null }, TROLL] });
      const user = userEvent.setup();
      await renderTab(SEVERAL);
      await user.type(amountField('Goblin'), '4');
      await user.type(amountField('Troll'), '6');

      expect(button('Damage')).toBeEnabled();
      await user.click(button('Damage'));

      await waitFor(() => {
        expect(recordLogEntry).toHaveBeenCalledWith(
          ROUTE_ENCOUNTER_ID,
          'damage',
          {
            targets: [
              { queueItemId: ITEM_ID, amount: 4 },
              { queueItemId: THIRD_ID, amount: 6 },
            ],
          },
        );
      });
    });

    it('disables Damage while an applicable row is empty', async () => {
      const user = userEvent.setup();
      await renderTab(SEVERAL);
      await user.type(amountField('Goblin'), '4');
      await user.type(amountField('Orc'), '4');

      expect(button('Damage')).toBeDisabled();

      await user.type(amountField('Troll'), '4');

      expect(button('Damage')).toBeEnabled();
    });

    it('writes one Remove entry listing every selected id', async () => {
      const user = userEvent.setup();
      await renderTab(SEVERAL);

      await user.click(button('Remove'));

      await waitFor(() => {
        expect(recordLogEntry.mock.calls).toEqual([
          [
            ROUTE_ENCOUNTER_ID,
            'removed',
            { queueItemIds: [ITEM_ID, OTHER_ID, THIRD_ID] },
          ],
        ]);
      });
    });

    it('marks defeated only the combatants that are not defeated and disables the button when all are', async () => {
      arrange({
        combatants: [GOBLIN, ORC, TROLL],
        logEntries: [
          buildEncounterLogEntry('defeated', { queueItemIds: [OTHER_ID] }),
        ],
      });
      const user = userEvent.setup();
      await renderTab(SEVERAL);
      await waitFor(() => {
        expect(button('Unmark defeated')).toBeEnabled();
      });

      await user.click(button('Mark defeated'));

      await waitFor(() => {
        expect(recordLogEntry).toHaveBeenCalledWith(
          ROUTE_ENCOUNTER_ID,
          'defeated',
          { queueItemIds: [ITEM_ID, THIRD_ID] },
        );
      });
    });

    it('unmarks defeated only the defeated combatants and disables the button when none is', async () => {
      arrange({
        combatants: [GOBLIN, ORC, TROLL],
        logEntries: [
          buildEncounterLogEntry('defeated', { queueItemIds: [OTHER_ID] }),
        ],
      });
      const user = userEvent.setup();
      await renderTab(SEVERAL);
      await waitFor(() => {
        expect(button('Unmark defeated')).toBeEnabled();
      });

      await user.click(button('Unmark defeated'));

      await waitFor(() => {
        expect(recordLogEntry).toHaveBeenCalledWith(
          ROUTE_ENCOUNTER_ID,
          'undefeated',
          { queueItemIds: [OTHER_ID] },
        );
      });
    });

    it('disables Mark defeated when every selected combatant is defeated', async () => {
      arrange({
        combatants: [GOBLIN, ORC, TROLL],
        logEntries: SEVERAL.map((id, index) =>
          buildEncounterLogEntry(
            'defeated',
            { queueItemIds: [id] },
            { id: `log-${index}` },
          ),
        ),
      });
      await renderTab(SEVERAL);

      await waitFor(() => {
        expect(button('Mark defeated')).toBeDisabled();
      });
      expect(button('Unmark defeated')).toBeEnabled();
    });

    it('disables Unmark defeated when no selected combatant is defeated', async () => {
      await renderTab(SEVERAL);

      expect(button('Unmark defeated')).toBeDisabled();
      expect(button('Mark defeated')).toBeEnabled();
    });

    it('keeps the rows and the shared field after an action and gives a joining combatant the shared text', async () => {
      const user = userEvent.setup();
      const { rerender } = await renderTab([ITEM_ID, OTHER_ID]);
      await user.type(sharedField(), '4');
      await user.clear(amountField('Orc'));
      await user.type(amountField('Orc'), '9');
      await user.click(button('Damage'));
      await waitFor(() => {
        expect(recordLogEntry).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(button('Damage')).toBeEnabled();
      });

      expect(sharedField()).toHaveValue(4);
      expect(amountField('Goblin')).toHaveValue(4);
      expect(amountField('Orc')).toHaveValue(9);

      rerender(<EncounterCombatantActionsTab selectedIds={SEVERAL} />);

      expect(amountField('Troll')).toHaveValue(4);
      expect(amountField('Orc')).toHaveValue(9);
    });

    it('carries the amount edited in a row to the next single combatant selected', async () => {
      const user = userEvent.setup();
      const { rerender } = await renderTab([ITEM_ID, OTHER_ID]);
      await user.type(amountField('Orc'), '9');

      rerender(<EncounterCombatantActionsTab selectedIds={[OTHER_ID]} />);
      expect(amountField('Orc')).toHaveValue(9);

      rerender(<EncounterCombatantActionsTab selectedIds={[THIRD_ID]} />);
      expect(amountField('Troll')).toHaveValue(9);
    });
  });

  describe('with events selected', () => {
    const EVENTS_NOTE = 'Remove also removes: Lair action, Reinforcements';

    beforeEach(() => {
      arrange({ events: [LAIR, REINFORCEMENTS] });
    });

    it('enables only Remove, names the events and shows no row or amount field when only events are selected', async () => {
      await renderTab([LAIR.id, REINFORCEMENTS.id], EVENTS_NOTE);

      expect(button('Remove')).toBeEnabled();
      for (const label of [
        'Damage',
        'Heal',
        'Set temp HP',
        'Set max HP',
        'Mark defeated',
        'Unmark defeated',
      ]) {
        expect(button(label)).toBeDisabled();
      }
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Select a combatant in the queue.'),
      ).not.toBeInTheDocument();
    });

    it('shows no shared field, one row and the events line for one combatant and one event, and Damage writes for the combatant alone', async () => {
      arrange({ events: [LAIR] });
      const user = userEvent.setup();
      await renderTab([ITEM_ID, LAIR.id]);
      await user.type(amountField(), '5');

      expect(
        screen.queryByRole('spinbutton', { name: 'Shared amount' }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
      expect(
        screen.getByText('Remove also removes: Lair action'),
      ).toBeInTheDocument();

      await user.click(button('Damage'));

      await waitFor(() => {
        expect(recordLogEntry.mock.calls).toEqual([
          [
            ROUTE_ENCOUNTER_ID,
            'damage',
            { targets: [{ queueItemId: ITEM_ID, amount: 5 }] },
          ],
        ]);
      });
    });

    it('shows the shared field for two combatants and an event, and not for one combatant and two events', async () => {
      arrange({ combatants: [GOBLIN, ORC], events: [LAIR] });
      const { rerender } = await renderTab([ITEM_ID, OTHER_ID, LAIR.id]);

      expect(sharedField()).toBeInTheDocument();

      rerender(
        <EncounterCombatantActionsTab
          selectedIds={[ITEM_ID, LAIR.id, 'event-2']}
        />,
      );

      expect(
        screen.queryByRole('spinbutton', { name: 'Shared amount' }),
      ).not.toBeInTheDocument();
    });

    it('writes one Remove entry holding a combatant and an event in queue order', async () => {
      const user = userEvent.setup();
      await renderTab([LAIR.id, ITEM_ID]);

      await user.click(button('Remove'));

      await waitFor(() => {
        expect(recordLogEntry.mock.calls).toEqual([
          [ROUTE_ENCOUNTER_ID, 'removed', { queueItemIds: [ITEM_ID, LAIR.id] }],
        ]);
      });
    });
  });
});
