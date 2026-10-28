import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import type * as settingsDb from '@db/_settings';
import type * as baseEntityService from '@services/baseEntityService';
import type * as queueService from '@services/encounterQueueService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterAddTab } from '../EncounterAddTab';

const getAllBaseEntities = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getAllBaseEntities>(),
);
const getQueueItems = vi.hoisted(() =>
  vi.fn<typeof queueService.getQueueItems>(),
);
const getSetting = vi.hoisted(() => vi.fn<typeof settingsDb.getSetting>());
const updateSetting = vi.hoisted(() =>
  vi.fn<typeof settingsDb.updateSetting>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));
vi.mock('@db/_settings', () => ({ getSetting, updateSetting }));

// Answers as the router does: the params of the route named by `from`, and nothing for another route.
vi.mock('@tanstack/react-router', () => ({
  useParams: ({ from }: { from: string }) =>
    from === '/adventure/$adventureId/encounter/$encounterId'
      ? { adventureId: 'adventure-1', encounterId: 'encounter-1' }
      : {},
}));

const entity = (
  name: string,
  entityType: BaseEntity['entity_type'],
  description: string | null = null,
): BaseEntity => ({
  id: name,
  adventure_id: 'adventure-1',
  entity_type: entityType,
  name,
  description,
  image_id: null,
  pinned_order: null,
  created_at: '',
  updated_at: '',
});

const arrange = (entities: BaseEntity[]) => {
  getAllBaseEntities.mockImplementation((entityType) =>
    Promise.resolve(entities.filter((e) => e.entity_type === entityType)),
  );
};

const renderTab = async () => {
  render(<EncounterAddTab />, { wrapper: TanstackQueryClientProvider });
  await screen.findByPlaceholderText('Search entities...');
};

const shownNames = (names: string[]) =>
  screen
    .queryAllByText(
      (_, element) => names.includes(element?.textContent ?? ''),
      {
        selector: '.clip-text',
      },
    )
    .map((element) => element.textContent);

describe('EncounterAddTab', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    getSetting.mockResolvedValue(null);
    updateSetting.mockReset().mockResolvedValue();
    arrange([
      entity('Orc', 'foes'),
      entity('Alice', 'npcs', 'a tall orc hunter'),
      entity('Bree', 'pcs'),
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lists every type by name when no filter is saved', async () => {
    await renderTab();

    expect(shownNames(['Alice', 'Bree', 'Orc'])).toEqual([
      'Alice',
      'Bree',
      'Orc',
    ]);
  });

  it('saves a checked type together with the types already saved', async () => {
    getSetting.mockResolvedValue({ entity_types: ['foes'] });
    const user = userEvent.setup();
    await renderTab();

    await user.click(screen.getByRole('checkbox', { name: 'NPC' }));

    expect(updateSetting).toHaveBeenCalledWith('encounterAddFilter', {
      entity_types: ['foes', 'npcs'],
    });
  });

  it('removes an unchecked type from the saved types', async () => {
    getSetting.mockResolvedValue({ entity_types: ['foes', 'npcs'] });
    const user = userEvent.setup();
    await renderTab();

    await user.click(screen.getByRole('checkbox', { name: 'Foe' }));

    expect(updateSetting).toHaveBeenCalledWith('encounterAddFilter', {
      entity_types: ['npcs'],
    });
  });

  it('lists only the types of a saved selection', async () => {
    getSetting.mockResolvedValue({ entity_types: ['foes', 'pcs'] });
    await renderTab();

    expect(
      await screen.findByText('Bree', { selector: '.clip-text' }),
    ).toBeInTheDocument();
    expect(shownNames(['Alice', 'Bree', 'Orc'])).toEqual(['Bree', 'Orc']);
  });

  it('narrows the list by name and by description with the name matches first', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    await renderTab();

    await user.type(screen.getByPlaceholderText('Search entities...'), 'orc');
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(shownNames(['Alice', 'Bree', 'Orc'])).toEqual(['Orc', 'Alice']);
  });

  it('shows the no-entities line for an adventure without entities', async () => {
    arrange([]);
    render(<EncounterAddTab />, { wrapper: TanstackQueryClientProvider });

    expect(
      await screen.findByText('This adventure has no entities yet.'),
    ).toBeInTheDocument();
  });

  it('shows No results found for a search without a match', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    await renderTab();

    await user.type(screen.getByPlaceholderText('Search entities...'), 'zzz');
    await act(() => vi.runOnlyPendingTimersAsync());

    expect(
      within(screen.getByRole('list')).getByText('No results found'),
    ).toBeInTheDocument();
  });
});
