import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as tableConfigDb from '@db/table-config';
import { buildTableConfig } from './support/tableConfigFixtures';

const getAll = vi.hoisted(() => vi.fn<typeof tableConfigDb.getAll>());
const get = vi.hoisted(() => vi.fn<typeof tableConfigDb.get>());
const update = vi.hoisted(() => vi.fn<typeof tableConfigDb.update>());

vi.mock('@db/table-config', () => ({ getAll, get, update }));

beforeEach(() => {
  vi.resetModules();
  getAll.mockReset().mockResolvedValue([]);
  get.mockReset().mockResolvedValue(null);
  update.mockReset().mockResolvedValue();
});

describe('getAllTableConfigs', () => {
  it('returns every table config', async () => {
    const { getAllTableConfigs } = await import('../tableConfigService');
    const configs = [
      buildTableConfig({ id: 'a' }),
      buildTableConfig({ id: 'b' }),
    ];
    getAll.mockResolvedValue(configs);

    await expect(getAllTableConfigs()).resolves.toEqual(configs);
  });

  it('rejects as TableConfigLoadError when the load fails', async () => {
    const { getAllTableConfigs } = await import('../tableConfigService');
    getAll.mockRejectedValue(new Error('disk'));

    await expect(getAllTableConfigs()).rejects.toMatchObject({
      name: 'TableConfigLoadError',
    });
  });
});

describe('getTableConfigById', () => {
  it('returns the table config', async () => {
    const { getTableConfigById } = await import('../tableConfigService');
    const config = buildTableConfig({ id: 'found' });
    get.mockResolvedValue(config);

    await expect(getTableConfigById('found')).resolves.toEqual(config);
    expect(get).toHaveBeenCalledWith('found');
  });

  it('rejects as TableConfigNotFoundError when there is no such config', async () => {
    const { getTableConfigById } = await import('../tableConfigService');

    await expect(getTableConfigById('missing')).rejects.toMatchObject({
      name: 'TableConfigNotFoundError',
    });
  });

  it('lets a failing load through as the error the database raised', async () => {
    const { getTableConfigById } = await import('../tableConfigService');
    const failure = new Error('disk');
    get.mockRejectedValue(failure);

    await expect(getTableConfigById('any')).rejects.toBe(failure);
  });
});

describe('updateTableConfig', () => {
  it('hands the id and the data to the update', async () => {
    const { updateTableConfig } = await import('../tableConfigService');

    await updateTableConfig('c1', { color: '#000000' });

    expect(update).toHaveBeenCalledWith('c1', { color: '#000000' });
  });

  it('rejects as TableConfigUpdateError when the update fails', async () => {
    const { updateTableConfig } = await import('../tableConfigService');
    update.mockRejectedValue(new Error('disk'));

    await expect(updateTableConfig('c1', {})).rejects.toMatchObject({
      name: 'TableConfigUpdateError',
    });
  });
});
