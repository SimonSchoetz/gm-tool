import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { ROUTE_ENCOUNTER_ID } from '@/__tests__/support/encounterRouteParams';
import type * as service from '@services/encounterQueueService';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';
import { EncounterAddRow } from '../EncounterAddRow';

const getQueueItems = vi.hoisted(() => vi.fn<typeof service.getQueueItems>());
const addEntityCombatants = vi.hoisted(() =>
  vi.fn<typeof service.addEntityCombatants>(),
);

vi.mock('@services/encounterQueueService', () => ({
  getQueueItems,
  addEntityCombatants,
}));

vi.mock('@tanstack/react-router', async () => {
  const { encounterRouteParams } =
    await import('@/__tests__/support/encounterRouteParams');
  return { useParams: encounterRouteParams };
});

const renderRows = (...entities: BaseEntity[]) =>
  render(
    <ul>
      {entities.map((entity) => (
        <EncounterAddRow key={entity.id} baseEntity={entity} />
      ))}
    </ul>,
    { wrapper: TanstackQueryClientProvider },
  );

const setQuantity = async (
  user: ReturnType<typeof userEvent.setup>,
  quantity: HTMLElement,
  text: string,
) => {
  await user.clear(quantity);
  await user.type(quantity, text);
};

describe('EncounterAddRow', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    addEntityCombatants.mockReset().mockResolvedValue();
  });

  it('puts the last valid quantity back when the field is left empty', async () => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));
    const quantity = screen.getByLabelText('Quantity');

    await setQuantity(user, quantity, '5');
    await user.clear(quantity);
    await user.tab();

    expect(quantity).toHaveValue(5);
  });

  it.each(['0', '100', '1.5'])(
    'disables Add for the quantity %s',
    async (text) => {
      const user = userEvent.setup();
      renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

      await setQuantity(user, screen.getByLabelText('Quantity'), text);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    },
  );

  it('disables Add for an empty quantity', async () => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

    await user.clear(screen.getByLabelText('Quantity'));

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it.each(['1', '99'])('enables Add for the quantity %s', async (text) => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

    await setQuantity(user, screen.getByLabelText('Quantity'), text);

    expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
  });

  it('adds the quantity of the entity to the route’s encounter when Add is clicked', async () => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

    await setQuantity(user, screen.getByLabelText('Quantity'), '3');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(addEntityCombatants).toHaveBeenCalledWith(
        ROUTE_ENCOUNTER_ID,
        'foes',
        'goblin',
        3,
      );
    });
  });

  it('disables the Add buttons of every row while an add is pending and resets the quantity once it resolves', async () => {
    const user = userEvent.setup();
    const pendingAdd: { finish: (() => void) | null } = { finish: null };
    addEntityCombatants.mockReturnValue(
      new Promise<void>((resolve) => {
        pendingAdd.finish = resolve;
      }),
    );
    renderRows(
      buildBaseEntity({ id: 'goblin', name: 'Goblin' }),
      buildBaseEntity({ id: 'orc', name: 'Orc' }),
    );
    const [goblinQuantity] = screen.getAllByLabelText('Quantity');

    await setQuantity(user, goblinQuantity, '3');
    await user.click(screen.getAllByRole('button', { name: 'Add' })[0]);

    await waitFor(() => {
      for (const addButton of screen.getAllByRole('button', { name: 'Add' })) {
        expect(addButton).toBeDisabled();
      }
    });

    pendingAdd.finish?.();

    await waitFor(() => {
      for (const addButton of screen.getAllByRole('button', { name: 'Add' })) {
        expect(addButton).toBeEnabled();
      }
    });
    expect(goblinQuantity).toHaveValue(1);
  });
  it('keeps the quantity at 1 on leaving the field after an add of another quantity', async () => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));
    const quantity = screen.getByLabelText('Quantity');

    await setQuantity(user, quantity, '3');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => {
      expect(addEntityCombatants).toHaveBeenCalledTimes(1);
    });
    await user.click(quantity);
    await user.clear(quantity);
    await user.tab();

    expect(quantity).toHaveValue(1);
  });
});
