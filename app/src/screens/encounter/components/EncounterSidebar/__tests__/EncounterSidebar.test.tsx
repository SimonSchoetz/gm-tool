import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as settingsDb from '@db/_settings';
import type * as baseEntityService from '@services/baseEntityService';
import type * as encounterService from '@services/encounterService';
import type * as logEntryService from '@services/encounterLogEntryService';
import type * as queueService from '@services/encounterQueueService';
import { buildEncounter } from '@/__tests__/support/buildEncounter';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import type { SidebarTab } from '../../../hooks/useEncounterSelection';
import { EncounterSidebar } from '../EncounterSidebar';

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
const getSetting = vi.hoisted(() => vi.fn<typeof settingsDb.getSetting>());
const updateSetting = vi.hoisted(() =>
  vi.fn<typeof settingsDb.updateSetting>(),
);

vi.mock('@services/baseEntityService', () => ({ getAllBaseEntities }));
vi.mock('@services/encounterService', () => ({ getEncounterById }));
vi.mock('@services/encounterLogEntryService', () => ({ getLogEntries }));
vi.mock('@services/encounterQueueService', () => ({ getQueueItems }));
vi.mock('@db/_settings', () => ({ getSetting, updateSetting }));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

// Holds the open tab the way the encounter screen does, since the sidebar only reports tab changes.
const StatefulSidebar = ({
  onTabChange,
}: {
  onTabChange: (tab: SidebarTab) => void;
}) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('add');
  return (
    <EncounterSidebar
      activeTab={activeTab}
      onTabChange={(tab) => {
        onTabChange(tab);
        setActiveTab(tab);
      }}
      selectedId={null}
    />
  );
};

const renderSidebar = async (
  onTabChange: (tab: SidebarTab) => void = vi.fn(),
) => {
  render(<StatefulSidebar onTabChange={onTabChange} />, {
    wrapper: TanstackQueryClientProvider,
  });
  await screen.findByPlaceholderText('Search entities...');
};

describe('EncounterSidebar', () => {
  beforeEach(() => {
    queryClient.clear();
    getAllBaseEntities.mockResolvedValue([]);
    getEncounterById.mockResolvedValue(buildEncounter());
    getLogEntries.mockResolvedValue([]);
    getQueueItems.mockResolvedValue([]);
    getSetting.mockResolvedValue(null);
    updateSetting.mockReset().mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the id of the tab that is clicked', async () => {
    const onTabChange = vi.fn();
    const user = userEvent.setup();
    await renderSidebar(onTabChange);

    await user.click(screen.getByRole('tab', { name: 'Actions' }));
    await user.click(screen.getByRole('tab', { name: 'Add' }));

    expect(onTabChange.mock.calls).toEqual([['actions'], ['add']]);
  });

  it('shows only the active tab panel to the accessibility tree', async () => {
    const user = userEvent.setup();
    await renderSidebar();

    expect(
      screen.getAllByRole('tabpanel').map((panel) => panel.ariaLabel),
    ).toEqual(['Add']);

    await user.click(screen.getByRole('tab', { name: 'Actions' }));

    expect(
      screen.getAllByRole('tabpanel').map((panel) => panel.ariaLabel),
    ).toEqual(['Actions']);
  });

  it('keeps the Add search text while the Actions tab is open', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup();
    await renderSidebar();
    await user.type(screen.getByPlaceholderText('Search entities...'), 'orc');
    await act(() => vi.runOnlyPendingTimersAsync());

    await user.click(screen.getByRole('tab', { name: 'Actions' }));
    await user.click(screen.getByRole('tab', { name: 'Add' }));

    expect(screen.getByPlaceholderText('Search entities...')).toHaveValue(
      'orc',
    );
  });
});
