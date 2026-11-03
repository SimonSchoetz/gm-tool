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

describe('EncounterAddRow', () => {
  beforeEach(() => {
    queryClient.clear();
    getQueueItems.mockResolvedValue([]);
    addEntityCombatants.mockReset().mockResolvedValue();
  });

  it('shows no quantity field', () => {
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
  });

  it('adds the entity to the route’s encounter when Add is clicked', async () => {
    const user = userEvent.setup();
    renderRows(buildBaseEntity({ id: 'goblin', name: 'Goblin' }));

    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(addEntityCombatants).toHaveBeenCalledWith(
        ROUTE_ENCOUNTER_ID,
        'foes',
        'goblin',
      );
    });
  });

  it('disables the Add buttons of every row while an add is pending and enables them again once it resolves', async () => {
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
  });
});
