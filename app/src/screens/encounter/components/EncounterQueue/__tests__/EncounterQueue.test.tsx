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
import { EncounterQueue } from '../EncounterQueue';

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
const reorderQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.reorderQueueItems>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  reorderQueueItems,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const COMBATANTS = [
  { id: 'item-1', name: 'Goblin' },
  { id: 'item-2', name: 'Orc' },
  { id: 'item-3', name: 'Troll' },
  { id: 'item-4', name: 'Imp' },
  { id: 'item-5', name: 'Wolf' },
];

const renderQueue = async (
  selectedIds: string[],
  onSelect: (id: string, modifiers: unknown) => void = vi.fn(),
) => {
  render(<EncounterQueue selectedIds={selectedIds} onSelect={onSelect} />, {
    wrapper: TanstackQueryClientProvider,
  });
  await screen.findByText('Goblin');
};

// Every entry's handle is a button named by the same grip glyph, in queue order.
const handleOf = (name: string) => {
  const index = COMBATANTS.findIndex((combatant) => combatant.name === name);
  return screen.getAllByRole('button', { name: '⠿' })[index];
};

const holdHandle = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  const handle = handleOf(name);
  await user.pointer([
    { keys: '[MouseLeft>]', target: handle },
    { target: handle, coords: { clientX: 10, clientY: 10 } },
  ]);
  return handle;
};

describe('EncounterQueue', () => {
  beforeEach(() => {
    queryClient.clear();
    getEncounterById.mockResolvedValue(buildEncounter());
    getLogEntries.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
    getQueueItems.mockResolvedValue(
      COMBATANTS.map(({ id, name }, index) =>
        buildEncounterQueueItem({ id, name, sort_order: index }),
      ),
    );
    reorderQueueItems.mockReset().mockResolvedValue();
  });

  afterEach(async () => {
    vi.useRealTimers();
    // dnd-kit keeps its document click listener, which swallows the click that follows a drag, for 50 ms after the drag ends; a click in the next test must not meet it.
    await new Promise((resolve) => {
      setTimeout(resolve, 60);
    });
  });

  it('saves a dragged selected entry with the other selected entries adjacent in their original order', async () => {
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-4']);

    const handle = await holdHandle(user, 'Imp');
    await user.pointer({ keys: '[/MouseLeft]', target: handle });

    await waitFor(() => {
      expect(reorderQueueItems).toHaveBeenCalledTimes(1);
    });
    const [saved] = reorderQueueItems.mock.calls[0];
    expect([...saved].sort()).toEqual(COMBATANTS.map(({ id }) => id));
    const selectedAt = ['item-2', 'item-4'].map((id) => saved.indexOf(id));
    expect(selectedAt[1] - selectedAt[0]).toBe(1);
    expect(saved.filter((id) => !['item-2', 'item-4'].includes(id))).toEqual([
      'item-1',
      'item-3',
      'item-5',
    ]);
  });

  it('moves only an unselected entry when it is dragged and never reports a selection', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-4'], onSelect);

    const handle = await holdHandle(user, 'Troll');
    await user.pointer({ keys: '[/MouseLeft]', target: handle });

    await waitFor(() => {
      expect(reorderQueueItems).toHaveBeenCalledTimes(1);
    });
    const [saved] = reorderQueueItems.mock.calls[0];
    expect([...saved].sort()).toEqual(COMBATANTS.map(({ id }) => id));
    expect(saved.filter((id) => id !== 'item-3')).toEqual([
      'item-1',
      'item-2',
      'item-4',
      'item-5',
    ]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('removes the other selected names and shows +N on the dragged entry while the block is held, and brings them back on release', async () => {
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-3', 'item-4']);

    const handle = await holdHandle(user, 'Imp');

    await waitFor(() => {
      expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Troll')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();

    await user.pointer({ keys: '[/MouseLeft]', target: handle });

    expect(await screen.findByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Troll')).toBeInTheDocument();
    expect(screen.queryByText('+2')).not.toBeInTheDocument();
  });

  it('shows the badge in the commit that starts the drag and folds the other selected entries one frame later', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-3', 'item-4']);

    await holdHandle(user, 'Imp');

    expect(screen.getByText('+2')).toBeInTheDocument();
    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Troll')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(20));

    expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    expect(screen.queryByText('Troll')).not.toBeInTheDocument();
  });

  it('leaves the list alone when the frame of a finished drag arrives after its release', async () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-4']);
    const handle = await holdHandle(user, 'Imp');
    await user.pointer({ keys: '[/MouseLeft]', target: handle });

    await act(() => vi.advanceTimersByTimeAsync(20));

    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.getByText('Imp')).toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('shows no badge and keeps every entry while an unselected entry is dragged', async () => {
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-4']);

    await holdHandle(user, 'Troll');
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    expect(screen.getByText('Orc')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('saves nothing and brings the entries back when Escape cancels the drag', async () => {
    const user = userEvent.setup();
    await renderQueue(['item-2', 'item-4']);
    await holdHandle(user, 'Imp');
    await waitFor(() => {
      expect(screen.queryByText('Orc')).not.toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    expect(await screen.findByText('Orc')).toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
    expect(reorderQueueItems).not.toHaveBeenCalled();
  });

  it('marks the selected entries as current and reports a click with its id and modifiers', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    await renderQueue(['item-2'], onSelect);

    expect(
      screen.getByText('Orc').closest('[aria-current="true"]'),
    ).not.toBeNull();
    expect(
      screen.getByText('Troll').closest('[aria-current="true"]'),
    ).toBeNull();

    await user.click(screen.getByText('Troll'));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByText('Wolf'));

    expect(onSelect.mock.calls).toEqual([
      ['item-3', { shift: false, toggle: false }],
      ['item-5', { shift: true, toggle: false }],
    ]);
  });
});
