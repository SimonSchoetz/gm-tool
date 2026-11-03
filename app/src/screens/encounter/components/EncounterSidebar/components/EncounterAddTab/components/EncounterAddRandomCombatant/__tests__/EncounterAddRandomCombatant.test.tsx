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
import { EncounterAddRandomCombatant } from '../EncounterAddRandomCombatant';

const getQueueItems = vi.hoisted(() => vi.fn<typeof service.getQueueItems>());
const addRandomCombatant = vi.hoisted(() =>
  vi.fn<typeof service.addRandomCombatant>(),
);

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  addRandomCombatant,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const nameField = () =>
  screen.getByRole('textbox', { name: 'Combatant name to add' });
const hpField = () => screen.getByRole('textbox', { name: 'HP' });
const addButton = () => screen.getByRole('button', { name: 'Add' });

const withDeferredAdd = () => {
  let release: (() => void) | null = null;
  addRandomCombatant.mockReturnValue(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return () => {
    release?.();
  };
};

const fill = async (
  user: ReturnType<typeof userEvent.setup>,
  { name = 'Grunt', hp = '' } = {},
) => {
  if (name !== '') await user.type(nameField(), name);
  if (hp !== '') await user.type(hpField(), hp);
};

describe('EncounterAddRandomCombatant', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    addRandomCombatant.mockReset().mockResolvedValue();
    render(<EncounterAddRandomCombatant hidden={false} />, {
      wrapper: TanstackQueryClientProvider,
    });
  });

  it.each([
    ['an empty name', { name: '' }],
    ['a spaces-only name', { name: '   ' }],
    ['HP abc', { hp: 'abc' }],
    ['HP -1', { hp: '-1' }],
    ['HP 1.5', { hp: '1.5' }],
  ])('disables Add for %s', async (_label, values) => {
    const user = userEvent.setup();

    await fill(user, values);

    expect(addButton()).toBeDisabled();
  });

  it.each([
    ['HP 1e3', { hp: '1e3' }],
    ['an empty HP', { hp: '' }],
  ])('enables Add for %s', async (_label, values) => {
    const user = userEvent.setup();

    await fill(user, values);

    expect(addButton()).toBeEnabled();
  });

  it('adds with the route encounter id, the typed name and the parsed HP, then empties the name and HP', async () => {
    const user = userEvent.setup();
    await fill(user, { name: 'Grunt', hp: '1e3' });

    await user.click(addButton());

    await waitFor(() => {
      expect(addRandomCombatant).toHaveBeenCalledWith(
        ROUTE_ENCOUNTER_ID,
        'Grunt',
        1000,
      );
    });
    await waitFor(() => {
      expect(nameField()).toHaveValue('');
    });
    expect(hpField()).toHaveValue('');
  });

  it('adds with no HP for an empty field', async () => {
    const user = userEvent.setup();
    await fill(user);

    await user.click(addButton());

    await waitFor(() => {
      expect(addRandomCombatant).toHaveBeenCalledWith(
        ROUTE_ENCOUNTER_ID,
        'Grunt',
        null,
      );
    });
  });

  it.each([
    ['name', nameField],
    ['HP', hpField],
  ])(
    'adds on Enter in the %s field while Add is enabled',
    async (_label, field) => {
      const user = userEvent.setup();
      await fill(user, { hp: '10' });

      await user.type(field(), '{Enter}');

      await waitFor(() => {
        expect(addRandomCombatant).toHaveBeenCalledTimes(1);
      });
    },
  );

  it.each([
    ['name', nameField],
    ['HP', hpField],
  ])(
    'adds nothing on Enter in the %s field while Add is disabled',
    async (_label, field) => {
      const user = userEvent.setup();
      await user.type(hpField(), 'abc');

      await user.type(field(), '{Enter}');

      expect(addRandomCombatant).not.toHaveBeenCalled();
    },
  );

  it('disables Add while an add is pending and enables it again after it resolves', async () => {
    const releaseAdd = withDeferredAdd();
    const user = userEvent.setup();
    await fill(user);

    await user.click(addButton());
    await user.type(nameField(), 'Brute');
    await waitFor(() => {
      expect(addButton()).toBeDisabled();
    });

    act(() => {
      releaseAdd();
    });
    await waitFor(() => {
      expect(nameField()).toHaveValue('');
    });
    await user.type(nameField(), 'Brute');

    expect(addButton()).toBeEnabled();
  });

  it('leaves every field as typed when the add is refused because another add of the encounter started in the same call stack', async () => {
    const user = userEvent.setup();
    render(<EncounterAddRandomCombatant hidden={false} />, {
      wrapper: TanstackQueryClientProvider,
    });
    const [firstName, secondName] = screen.getAllByRole('textbox', {
      name: 'Combatant name to add',
    });
    await user.type(firstName, 'Grunt');
    await user.type(secondName, 'Brute');
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
    expect(addRandomCombatant).toHaveBeenCalledTimes(1);
    expect(secondName).toHaveValue('Brute');
  });
});
