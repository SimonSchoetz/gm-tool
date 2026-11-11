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

const deleteBaseEntity = vi.hoisted(() =>
  vi.fn<typeof service.deleteBaseEntity>(),
);
const duplicateBaseEntity = vi.hoisted(() =>
  vi.fn<typeof service.duplicateBaseEntity>(),
);
const removeBaseEntityImage = vi.hoisted(() =>
  vi.fn<typeof service.removeBaseEntityImage>(),
);

vi.mock('@services/baseEntityService', () => ({
  getBaseEntityById,
  updateBaseEntity,
  deleteBaseEntity,
  duplicateBaseEntity,
  removeBaseEntityImage,
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

describe('useBaseEntity data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getBaseEntityById.mockImplementation((entityType, id) =>
      Promise.resolve(baseEntityRow(entityType, id)),
    );
    updateBaseEntity.mockReset().mockResolvedValue(undefined);
    deleteBaseEntity.mockReset().mockResolvedValue(undefined);
    duplicateBaseEntity.mockReset().mockResolvedValue('copied-entity');
    removeBaseEntityImage.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no base entity and loading until it has loaded, then the loaded entity', async () => {
    const { result } = renderHookWithQueryClient(
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

    expect(result.current.baseEntity).toBeNull();
    expect(result.current.loading).toBe(true);

    await settle(0);

    expect(result.current.baseEntity?.id).toBe('entity-1');
    expect(result.current.loading).toBe(false);
  });

  it('shows an edit at once in the cached entity, without the chosen file path', async () => {
    const { result } = await renderBaseEntity();

    act(() => {
      result.current.updateBaseEntity({
        name: 'Renamed',
        imgFilePath: '/pick/map.png',
      });
    });
    await settle(0);

    expect(result.current.baseEntity?.name).toBe('Renamed');
    expect(result.current.baseEntity).not.toHaveProperty('imgFilePath');
  });

  it('schedules no save and changes nothing before the entity has loaded', async () => {
    getBaseEntityById.mockImplementation(
      () => new Promise<BaseEntity>(() => undefined),
    );
    const { result, queryClient } = renderHookWithQueryClient(
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

    act(() => {
      result.current.updateBaseEntity({ name: 'x' });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateBaseEntity).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryData(baseEntityKeys.detail('npcs', 'entity-1')),
    ).toBeUndefined();
  });

  it('deletes the entity and invalidates the list of its type in its adventure', async () => {
    const { result, invalidateQueries } = await renderBaseEntity();

    await act(async () => {
      await result.current.deleteBaseEntity();
    });

    expect(deleteBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: baseEntityKeys.list('npcs', 'adventure-1'),
    });
  });

  it('duplicates the entity, resolves the id of the copy and invalidates only the list', async () => {
    const { result, invalidateQueries } = await renderBaseEntity();

    let copyId = '';
    await act(async () => {
      copyId = await result.current.duplicateBaseEntity();
    });

    expect(copyId).toBe('copied-entity');
    expect(duplicateBaseEntity).toHaveBeenCalledWith('npcs', 'entity-1');
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: baseEntityKeys.list('npcs', 'adventure-1') }],
    ]);
  });

  it('removes the entity image and invalidates the entity and its list', async () => {
    const { result, invalidateQueries } = await renderBaseEntity();

    await act(async () => {
      await result.current.removeBaseEntityImage();
    });

    expect(removeBaseEntityImage).toHaveBeenCalledWith('npcs', 'entity-1');
    expect(invalidateQueries.mock.calls).toEqual([
      [{ queryKey: baseEntityKeys.detail('npcs', 'entity-1') }],
      [{ queryKey: baseEntityKeys.list('npcs', 'adventure-1') }],
    ]);
  });
});
