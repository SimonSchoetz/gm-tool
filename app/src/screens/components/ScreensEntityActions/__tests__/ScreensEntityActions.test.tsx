import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as baseEntityService from '@services/baseEntityService';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { ScreensEntityActions } from '../ScreensEntityActions';

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
}));

// Stands in for a row menu: it renders the actions only while open and closes when one is chosen, so the actions unmount the moment they are chosen.
const MenuHost = () => {
  const [isOpen, setIsOpen] = useState(true);
  const closeMenu = () => {
    setIsOpen(false);
  };
  return isOpen ? (
    <ul>
      <ScreensEntityActions
        entityType='npcs'
        entityId='entity-1'
        adventureId='adventure-1'
        afterDelete='stay'
        onChoose={closeMenu}
      />
    </ul>
  ) : (
    <p>Menu closed</p>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <TanstackQueryClientProvider>
    <DeleteDialogProvider>{children}</DeleteDialogProvider>
  </TanstackQueryClientProvider>
);

describe('ScreensEntityActions in a menu that unmounts when an action is chosen', () => {
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

  it('still opens the copy with its name field focused after the menu has closed', async () => {
    const user = userEvent.setup();
    render(<MenuHost />, { wrapper: Wrapper });

    await user.click(await screen.findByRole('button', { name: 'Duplicate' }));

    expect(screen.getByText('Menu closed')).toBeInTheDocument();
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        to: '/adventure/adventure-1/npc/copy-1',
        state: { focusNameInput: true },
      });
    });
    expect(duplicateBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
  });

  it('still deletes the entity named in the dialog after the menu has closed, and does not navigate', async () => {
    const user = userEvent.setup();
    render(<MenuHost />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('Menu closed')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Delete Mira' }),
    ).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('DELETE Mira'), 'DELETE Mira');
    await waitFor(() => {
      expect(deleteBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps Delete disabled until the entity has loaded', () => {
    getBaseEntityById
      .mockReset()
      .mockReturnValue(new Promise<never>(() => undefined));
    render(<MenuHost />, { wrapper: Wrapper });

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
