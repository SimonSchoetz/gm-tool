import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { ScreensEntityActionsMenu } from '../ScreensEntityActionsMenu';

const getBaseEntityById = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.getBaseEntityById>(),
);
const duplicateBaseEntity = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.duplicateBaseEntity>(),
);
const deleteBaseEntity = vi.hoisted(() =>
  vi.fn<typeof baseEntityService.deleteBaseEntity>(),
);
const navigate = vi.hoisted(() => vi.fn());

vi.mock('@services/baseEntityService', () => ({
  getBaseEntityById,
  duplicateBaseEntity,
  deleteBaseEntity,
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useParams: () => ({
    adventureId: 'adventure-1',
    baseEntityId: 'entity-1',
  }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanstackQueryClientProvider>
    <DeleteDialogProvider>{children}</DeleteDialogProvider>
  </TanstackQueryClientProvider>
);

const renderMenu = () => {
  render(<ScreensEntityActionsMenu entityType='npcs' />, { wrapper: Wrapper });
};

const openPopup = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'NPC actions' }));
};

describe('ScreensEntityActionsMenu', () => {
  beforeEach(() => {
    queryClient.clear();
    navigate.mockReset();
    getBaseEntityById
      .mockReset()
      .mockResolvedValue(
        buildBaseEntity({ entity_type: 'npcs', name: 'Mira' }),
      );
    duplicateBaseEntity.mockReset().mockResolvedValue('copy-1');
    deleteBaseEntity.mockReset().mockResolvedValue();
  });

  it('labels the gear with the entity type and shows no popup until it is clicked', () => {
    renderMenu();

    expect(
      screen.getByRole('button', { name: 'NPC actions' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('opens a popup with Duplicate and Delete rows and a Close control when the gear is clicked', async () => {
    const user = userEvent.setup();
    renderMenu();

    await openPopup(user);

    expect(
      screen.getByRole('button', { name: 'Duplicate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes on a click outside it', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openPopup(user);

    await user.click(document.body);

    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('closes on the Close control', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openPopup(user);

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openPopup(user);

    await user.keyboard('{Escape}');

    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
  });

  it('closes when Duplicate is chosen and duplicates the entity of the route', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openPopup(user);

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(duplicateBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
    });
  });

  it('deletes the entity once Delete is confirmed and goes to the entity list', async () => {
    const user = userEvent.setup();
    renderMenu();
    await openPopup(user);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.type(screen.getByPlaceholderText('DELETE Mira'), 'DELETE Mira');

    await waitFor(() => {
      expect(deleteBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        to: '/adventure/adventure-1/npcs',
      });
    });
  });
});
