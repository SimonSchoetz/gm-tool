import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteDialogProvider } from '@/providers/DeleteDialogProvider';
import { EntityActionRows, type AfterDelete } from '../EntityActionRows';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

const LIST_PATH = '/adventure/adventure-1/npcs';
const COPY_PATH = '/adventure/adventure-1/npc/copy-1';

const onChoose = vi.fn<() => void>();
const duplicate = vi.fn<() => Promise<string>>();
const deleteEntity = vi.fn<() => Promise<void>>();

type RenderOptions = {
  afterDelete?: AfterDelete;
  withDuplicate?: boolean;
  name?: string;
};

const renderRows = ({
  afterDelete = 'stay',
  withDuplicate = true,
  name = 'Ambush',
}: RenderOptions = {}) => {
  const duplicateProp = withDuplicate ? { duplicate } : {};
  render(
    <DeleteDialogProvider>
      <ul>
        <EntityActionRows
          name={name}
          listPath={LIST_PATH}
          afterDelete={afterDelete}
          onChoose={onChoose}
          deleteEntity={deleteEntity}
          {...duplicateProp}
        />
      </ul>
    </DeleteDialogProvider>,
  );
};

const confirmDeletion = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  await user.type(
    screen.getByPlaceholderText(`DELETE ${name}`),
    `DELETE ${name}`,
  );
};

describe('EntityActionRows', () => {
  beforeEach(() => {
    navigate.mockReset();
    onChoose.mockReset();
    duplicate.mockReset().mockResolvedValue(COPY_PATH);
    deleteEntity.mockReset().mockResolvedValue();
  });

  it('opens the copy with its name field focused when Duplicate is chosen', async () => {
    const user = userEvent.setup();
    renderRows();

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({
        to: COPY_PATH,
        state: { focusNameInput: true },
      });
    });
  });

  it('closes the menu when Duplicate is chosen', async () => {
    const user = userEvent.setup();
    renderRows();

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('shows no Duplicate row when the entity cannot be duplicated', () => {
    renderRows({ withDuplicate: false });

    expect(
      screen.queryByRole('button', { name: 'Duplicate' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('opens a dialog naming the entity and deletes only once the confirmation text is typed', async () => {
    const user = userEvent.setup();
    renderRows({ name: 'Ambush' });

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(
      screen.getByRole('heading', { name: 'Delete Ambush' }),
    ).toBeInTheDocument();
    expect(deleteEntity).not.toHaveBeenCalled();

    await user.type(
      screen.getByPlaceholderText('DELETE Ambush'),
      'DELETE Ambush',
    );

    await waitFor(() => {
      expect(deleteEntity).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the menu when Delete is chosen', async () => {
    const user = userEvent.setup();
    renderRows();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('goes to the list after the deletion when afterDelete is go-to-list', async () => {
    const user = userEvent.setup();
    renderRows({ afterDelete: 'go-to-list' });

    await confirmDeletion(user, 'Ambush');

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: LIST_PATH });
    });
  });

  it('stays where it is after the deletion when afterDelete is stay', async () => {
    const user = userEvent.setup();
    renderRows({ afterDelete: 'stay' });

    await confirmDeletion(user, 'Ambush');
    await waitFor(() => {
      expect(deleteEntity).toHaveBeenCalledTimes(1);
    });
    await act(() => Promise.resolve());

    expect(navigate).not.toHaveBeenCalled();
  });
});
