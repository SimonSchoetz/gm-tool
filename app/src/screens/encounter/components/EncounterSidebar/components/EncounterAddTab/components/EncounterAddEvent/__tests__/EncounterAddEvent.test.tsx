import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTE_ENCOUNTER_ID } from '@/__tests__/support/encounterRouteParams';
import type * as service from '@services/encounterQueueService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterAddEvent } from '../EncounterAddEvent';

const getQueueItems = vi.hoisted(() => vi.fn<typeof service.getQueueItems>());
const addEvent = vi.hoisted(() => vi.fn<typeof service.addEvent>());

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  addEvent,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const nameField = () =>
  screen.getByRole('textbox', { name: 'Event name to add' });
const addButton = () => screen.getByRole('button', { name: 'Add' });

describe('EncounterAddEvent', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    addEvent.mockReset().mockResolvedValue();
    render(<EncounterAddEvent hidden={false} />, {
      wrapper: TanstackQueryClientProvider,
    });
  });

  it.each([
    ['an empty name', ''],
    ['a spaces-only name', '   '],
  ])('disables Add for %s', async (_label, name) => {
    const user = userEvent.setup();

    if (name !== '') await user.type(nameField(), name);

    expect(addButton()).toBeDisabled();
  });

  it('adds with the route encounter id and the typed name on a click and empties the field', async () => {
    const user = userEvent.setup();
    await user.type(nameField(), 'Lair action');

    await user.click(addButton());

    await waitFor(() => {
      expect(addEvent).toHaveBeenCalledWith(ROUTE_ENCOUNTER_ID, 'Lair action');
    });
    await waitFor(() => {
      expect(nameField()).toHaveValue('');
    });
  });

  it('adds on Enter and nothing on Enter while Add is disabled', async () => {
    const user = userEvent.setup();

    await user.type(nameField(), '   {Enter}');
    expect(addEvent).not.toHaveBeenCalled();

    await user.clear(nameField());
    await user.type(nameField(), 'Reinforcements{Enter}');

    await waitFor(() => {
      expect(addEvent).toHaveBeenCalledTimes(1);
    });
    expect(addEvent).toHaveBeenCalledWith(ROUTE_ENCOUNTER_ID, 'Reinforcements');
  });

  it('disables Add while an add is pending and enables it again after it resolves', async () => {
    let release: (() => void) | null = null;
    addEvent.mockReturnValue(
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    );
    const user = userEvent.setup();
    await user.type(nameField(), 'Lair action');

    await user.click(addButton());
    await user.type(nameField(), 'Next');
    await waitFor(() => {
      expect(addButton()).toBeDisabled();
    });

    act(() => {
      release?.();
    });
    await waitFor(() => {
      expect(nameField()).toHaveValue('');
    });
    await user.type(nameField(), 'Again');

    expect(addButton()).toBeEnabled();
  });

  it('keeps the text when the add is refused because another add of the encounter started in the same call stack', async () => {
    const user = userEvent.setup();
    render(<EncounterAddEvent hidden={false} />, {
      wrapper: TanstackQueryClientProvider,
    });
    const [firstName, secondName] = screen.getAllByRole('textbox', {
      name: 'Event name to add',
    });
    await user.type(firstName, 'First');
    await user.type(secondName, 'Second');
    const [firstAdd, secondAdd] = screen.getAllByRole('button', {
      name: 'Add',
    });

    act(() => {
      fireEvent.click(firstAdd);
      fireEvent.click(secondAdd);
    });

    await waitFor(() => {
      expect(firstName).toHaveValue('');
    });
    expect(addEvent).toHaveBeenCalledTimes(1);
    expect(secondName).toHaveValue('Second');
  });
});
