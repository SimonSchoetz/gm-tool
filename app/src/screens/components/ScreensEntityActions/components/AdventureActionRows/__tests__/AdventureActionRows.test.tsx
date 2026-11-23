import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Adventure } from '@db/adventure';
import type * as adventureService from '@services/adventureService';
import {
  adventureQueryOptions,
  queryClient,
  TanstackQueryClientProvider,
} from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { AdventureActionRows } from '../AdventureActionRows';

const getAdventureById = vi.hoisted(() =>
  vi.fn<typeof adventureService.getAdventureById>(),
);
const deleteAdventure = vi.hoisted(() =>
  vi.fn<typeof adventureService.deleteAdventure>(),
);
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@services/adventureService', () => ({
  getAdventureById,
  deleteAdventure,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

const ADVENTURE: Adventure = {
  id: 'adventure-1',
  name: 'Dragonfall',
  description: null,
  image_id: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanstackQueryClientProvider>
    <DeleteDialogProvider>{children}</DeleteDialogProvider>
  </TanstackQueryClientProvider>
);

const renderRows = () => {
  render(
    <ul>
      <AdventureActionRows
        entityId='adventure-1'
        afterDelete='go-to-list'
        onChoose={vi.fn()}
      />
    </ul>,
    { wrapper: Wrapper },
  );
};

describe('AdventureActionRows', () => {
  beforeEach(() => {
    queryClient.clear();
    navigate.mockReset();
    getAdventureById.mockReset().mockResolvedValue(ADVENTURE);
    deleteAdventure.mockReset().mockResolvedValue();
  });

  it('shows a Delete row and no Duplicate row, since adventures cannot be duplicated', () => {
    renderRows();

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('deletes the adventure named in the dialog once confirmed and goes to the adventures list', async () => {
    const user = userEvent.setup();
    await queryClient.query(adventureQueryOptions('adventure-1'));
    renderRows();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.type(
      screen.getByPlaceholderText('DELETE Dragonfall'),
      'DELETE Dragonfall',
    );

    await waitFor(() => {
      expect(deleteAdventure).toHaveBeenCalledWith('adventure-1');
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/adventures' });
    });
  });
});
