import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityType } from '@domain/entities';
import type * as service from '@services/baseEntityService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { baseEntityKeys } from '../baseEntityKeys';
import { useBaseEntity } from '../useBaseEntity';

const getBaseEntityById = vi.hoisted(() =>
  vi.fn<typeof service.getBaseEntityById>(),
);
const updateBaseEntity = vi.hoisted(() =>
  vi.fn<typeof service.updateBaseEntity>(),
);

vi.mock('@services/baseEntityService', () => ({
  getBaseEntityById,
  updateBaseEntity,
}));

const baseEntityRow = (entityType: BaseEntityType, id: string): BaseEntity => ({
  id,
  adventure_id: 'adventure-1',
  entity_type: entityType,
  name: null,
  description: null,
  image_id: null,
  pinned_order: null,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

type Props = {
  entityType: BaseEntityType;
  baseEntityId: string;
  adventureId: string;
};

const renderBaseEntity = async () => {
  const rendered = renderHookWithQueryClient(
    ({ entityType, baseEntityId, adventureId }: Props) =>
      useBaseEntity(entityType, baseEntityId, adventureId),
    {
      initialProps: {
        entityType: 'npcs',
        baseEntityId: 'entity-1',
        adventureId: 'adventure-1',
      },
    },
  );
  await settle(0);
  return rendered;
};

const otherEntity: Props = {
  entityType: 'pcs',
  baseEntityId: 'entity-2',
  adventureId: 'adventure-2',
};

describe('useBaseEntity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getBaseEntityById.mockImplementation((entityType, id) =>
      Promise.resolve(baseEntityRow(entityType, id)),
    );
    updateBaseEntity.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled entity, its type and its data after a re-render for another entity', async () => {
    const { result, rerender } = await renderBaseEntity();

    act(() => {
      result.current.updateBaseEntity({ name: 'n' });
    });
    rerender(otherEntity);
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateBaseEntity).toHaveBeenCalledTimes(1);
    expect(updateBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1', {
      name: 'n',
    });
  });

  it("invalidates the scheduled entity and its type's list in its adventure after a re-render", async () => {
    const { result, rerender, invalidateQueries } = await renderBaseEntity();

    act(() => {
      result.current.updateBaseEntity({ name: 'n' });
    });
    rerender(otherEntity);
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: baseEntityKeys.detail('npcs', 'entity-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: baseEntityKeys.list('npcs', 'adventure-1'),
    });
  });

  it("keeps an earlier edit's value when a later edit to the same entity leaves it undefined", async () => {
    const { result } = await renderBaseEntity();

    act(() => {
      result.current.updateBaseEntity({ description: 'kept' });
    });
    act(() => {
      result.current.updateBaseEntity({ name: 'n', description: undefined });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateBaseEntity).toHaveBeenCalledTimes(1);
    expect(updateBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1', {
      description: 'kept',
      name: 'n',
    });
  });
});
