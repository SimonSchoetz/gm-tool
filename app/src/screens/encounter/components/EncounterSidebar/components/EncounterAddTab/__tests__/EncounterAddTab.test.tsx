import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const SEARCH_PLACEHOLDER = 'Search entities...';

const renderTab = async () => {
  const rendered = render(<EncounterAddTab />, {
    wrapper: TanstackQueryClientProvider,
  });
  await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);
  return rendered;
};

// The switch is a button named by the option that is not selected, so a switch is driven by clicking the other option's label.
const clickSwitch = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(await screen.findByRole('button', { name }));
};

const eventField = () =>
  screen.queryByRole('textbox', { name: 'Event name to add' });
const combatantField = () =>
  screen.queryByRole('textbox', { name: 'Combatant name to add' });

describe('EncounterAddTab', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    getAllBaseEntities.mockResolvedValue([]);
    getSetting.mockResolvedValue(null);
    updateSetting.mockReset().mockResolvedValue();
  });

  it('starts on the entity list with the switch named Other, then shows the event form, and the random combatant form after Random Combatant', async () => {
    const user = userEvent.setup();
    await renderTab();

    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Other' })).toBeInTheDocument();
    expect(eventField()).not.toBeInTheDocument();
    expect(combatantField()).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Random Combatant' }),
    ).not.toBeInTheDocument();

    await clickSwitch(user, 'Other');

    expect(
      await screen.findByRole('textbox', { name: 'Event name to add' }),
    ).toBeVisible();
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeVisible();
    expect(combatantField()).not.toBeInTheDocument();

    await clickSwitch(user, 'Random Combatant');

    expect(
      await screen.findByRole('textbox', { name: 'Combatant name to add' }),
    ).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'HP' })).toBeVisible();
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add' })).toBeVisible();
    expect(eventField()).not.toBeInTheDocument();
  });

  it('keeps the typed drafts and the entity search text through every switch', async () => {
    const user = userEvent.setup();
    await renderTab();
    await user.type(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'orc');

    await clickSwitch(user, 'Other');
    await user.type(
      await screen.findByRole('textbox', { name: 'Event name to add' }),
      'Lair action',
    );
    await clickSwitch(user, 'Random Combatant');
    await user.type(
      await screen.findByRole('textbox', { name: 'Combatant name to add' }),
      'Grunt',
    );
    await user.type(screen.getByRole('textbox', { name: 'HP' }), '10');
    await clickSwitch(user, 'Event');
    expect(
      await screen.findByRole('textbox', { name: 'Event name to add' }),
    ).toHaveValue('Lair action');
    await clickSwitch(user, 'Random Combatant');
    expect(
      await screen.findByRole('textbox', { name: 'Combatant name to add' }),
    ).toHaveValue('Grunt');
    expect(screen.getByRole('textbox', { name: 'HP' })).toHaveValue('10');

    await clickSwitch(user, 'Entities');

    expect(await screen.findByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveValue(
      'orc',
    );
    expect(eventField()).not.toBeInTheDocument();
    expect(combatantField()).not.toBeInTheDocument();

    await clickSwitch(user, 'Other');
    expect(
      await screen.findByRole('textbox', { name: 'Combatant name to add' }),
    ).toHaveValue('Grunt');
  });

  it('starts on Entities and Event again after the tab is unmounted, even when Random Combatant was chosen last', async () => {
    const user = userEvent.setup();
    const { unmount } = await renderTab();
    await clickSwitch(user, 'Other');
    await clickSwitch(user, 'Random Combatant');
    await screen.findByRole('textbox', { name: 'Combatant name to add' });
    unmount();

    await renderTab();

    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeVisible();
    await clickSwitch(user, 'Other');
    expect(
      await screen.findByRole('textbox', { name: 'Event name to add' }),
    ).toBeVisible();
    expect(combatantField()).not.toBeInTheDocument();
  });
});
