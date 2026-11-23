import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TableConfig } from '@db/table-config';
import type * as tableConfigService from '@services/tableConfigService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { RowActionsMenu } from '../RowActionsMenu';

const getTableConfigById = vi.hoisted(() =>
  vi.fn<typeof tableConfigService.getTableConfigById>(),
);

vi.mock('@services/tableConfigService', () => ({ getTableConfigById }));
vi.mock('@services/pinnedOrderService', () => ({
  pinEntity: vi.fn(),
  unpinEntity: vi.fn(),
}));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const TABLE_CONFIG: TableConfig = {
  id: 'table-config-1',
  table_name: 'npcs',
  color: 'blue',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: [],
    columns: [],
    sort_state: { column: 'name', direction: 'asc' },
  },
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
};

const renderMenu = () => {
  const renderRowActions = (itemId: string, closeMenu: () => void) => (
    <li>
      <button onClick={closeMenu}>Custom action for {itemId}</button>
    </li>
  );
  render(
    <RowActionsMenu
      tableConfigId={TABLE_CONFIG.id}
      itemId='row-1'
      isPinned={false}
      renderRowActions={renderRowActions}
    />,
    { wrapper: TanstackQueryClientProvider },
  );
};

describe('RowActionsMenu', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    getTableConfigById.mockReset().mockResolvedValue(TABLE_CONFIG);
  });

  it('lists the rows the render prop supplies for the row, after the Pin row', async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole('button', { name: 'Row actions' }));

    const rows = screen.getAllByRole('listitem').map((row) => row.textContent);
    expect(rows).toEqual(['Pin', 'Custom action for row-1']);
  });

  it('closes the menu when a supplied row asks it to close', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Row actions' }));

    await user.click(
      screen.getByRole('button', { name: 'Custom action for row-1' }),
    );

    expect(
      screen.queryByRole('button', { name: 'Custom action for row-1' }),
    ).not.toBeInTheDocument();
  });

  it('closes the menu on Escape and stays open on another key', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Row actions' }));

    await user.keyboard('a');
    expect(
      screen.getByRole('button', { name: 'Custom action for row-1' }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('button', { name: 'Custom action for row-1' }),
    ).not.toBeInTheDocument();
  });
});
