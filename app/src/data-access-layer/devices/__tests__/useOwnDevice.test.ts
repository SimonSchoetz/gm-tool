import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as devicesService from '@services/devicesService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { deviceKeys } from '../deviceKeys';
import { useOwnDevice } from '../useOwnDevice';

const getOwnDevice = vi.hoisted(() =>
  vi.fn<typeof devicesService.getOwnDevice>(),
);
const renameOwnDevice = vi.hoisted(() =>
  vi.fn<typeof devicesService.renameOwnDevice>(),
);

vi.mock('@services/devicesService', () => ({ getOwnDevice, renameOwnDevice }));

const renderOwnDevice = async () => {
  const rendered = renderHookWithQueryClient(() => useOwnDevice());
  await settle(0);
  return rendered;
};

describe('useOwnDevice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getOwnDevice.mockResolvedValue({ id: 'a'.repeat(64), name: 'old' });
    renameOwnDevice.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes only the last name scheduled within the delay', async () => {
    const { result } = await renderOwnDevice();

    act(() => {
      result.current.renameOwnDevice('first');
    });
    act(() => {
      result.current.renameOwnDevice('second');
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(renameOwnDevice).toHaveBeenCalledTimes(1);
    expect(renameOwnDevice).toHaveBeenCalledWith('second');
  });

  it('invalidates the own-device query after the save', async () => {
    const { result, invalidateQueries } = await renderOwnDevice();

    act(() => {
      result.current.renameOwnDevice('new');
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: deviceKeys.own(),
    });
  });
});

describe('useOwnDevice data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getOwnDevice
      .mockReset()
      .mockResolvedValue({ id: 'a'.repeat(64), name: 'old' });
    renameOwnDevice.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no device until it has loaded, then the stored device', async () => {
    const { result } = renderHookWithQueryClient(() => useOwnDevice());

    expect(result.current.ownDevice).toBeNull();

    await settle(0);

    expect(result.current.ownDevice).toEqual({
      id: 'a'.repeat(64),
      name: 'old',
    });
  });

  it('shows the new name at once in the cached device, keeping its id', async () => {
    const { result } = await renderOwnDevice();

    act(() => {
      result.current.renameOwnDevice('new');
    });
    await settle(0);

    expect(result.current.ownDevice).toEqual({
      id: 'a'.repeat(64),
      name: 'new',
    });
  });

  it('leaves the cache empty when a rename comes before the device has loaded', () => {
    getOwnDevice.mockImplementation(() => new Promise(() => undefined));
    const { result, queryClient } = renderHookWithQueryClient(() =>
      useOwnDevice(),
    );

    act(() => {
      result.current.renameOwnDevice('new');
    });

    expect(queryClient.getQueryData(deviceKeys.own())).toBeUndefined();
  });

  it('throws a failed device load into the nearest Error Boundary instead of holding it as a query state', async () => {
    getOwnDevice.mockRejectedValue(new Error('device store unreadable'));
    renderHookWithQueryClient(() => useOwnDevice());

    await expect(settle(5000)).rejects.toThrow(/^device store unreadable$/);
  });
});
