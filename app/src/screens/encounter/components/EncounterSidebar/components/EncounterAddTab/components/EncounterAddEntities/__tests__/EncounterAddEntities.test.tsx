import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import type * as settingsDb from '@db/_settings';
import type * as baseEntityService from '@services/baseEntityService';
import type * as queueService from '@services/encounterQueueService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterAddEntities } from '../EncounterAddEntities';

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

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const arrange = (entities: BaseEntity[]) => {
  getAllBaseEntities.mockImplementation((entityType) =>
    Promise.resolve(entities.filter((e) => e.entity_type === entityType)),
  );
};

const renderTab = async () => {
  render(<EncounterAddEntities hidden={false} />, {
    wrapper: TanstackQueryClientProvider,
  });
  await screen.findByPlaceholderText('Search entities...');
};

// Matches the text a name element holds itself, in document order, so a wrapper around it is never counted.
const shownNames = (names: string[]) =>
  screen
    .queryAllByText(new RegExp(`^(${names.join('|')})$`))
    .map((element) => element.textContent);

describe('EncounterAddEntities', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    getSetting.mockResolvedValue(null);
    updateSetting.mockReset().mockResolvedValue();
    arrange([
      buildBaseEntity({ id: 'Orc', name: 'Orc', entity_type: 'foes' }),
      buildBaseEntity({
        id: 'Alice',
        name: 'Alice',
        entity_type: 'npcs',
        description: 'a tall orc hunter',
      }),
      buildBaseEntity({ id: 'Bree', name: 'Bree', entity_type: 'pcs' }),
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

    expect(await screen.findByText('Bree')).toBeInTheDocument();
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
    render(<EncounterAddEntities hidden={false} />, {
      wrapper: TanstackQueryClientProvider,
    });

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
