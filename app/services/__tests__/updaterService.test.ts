import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { invoke as invokeType, IpcChannel } from '@platform';
import type { DownloadProgressEvent } from '@domain';

const invoke = vi.hoisted(() => vi.fn<typeof invokeType>());

vi.mock('@platform', () => ({ invoke }));

beforeEach(() => {
  vi.resetModules();
  invoke.mockReset().mockResolvedValue(undefined);
});

describe('checkUpdate', () => {
  it('returns the version check_update reports, or null when there is none', async () => {
    const { checkUpdate } = await import('../updaterService');
    invoke.mockResolvedValueOnce('1.2.3').mockResolvedValueOnce(null);

    await expect(checkUpdate()).resolves.toBe('1.2.3');
    await expect(checkUpdate()).resolves.toBeNull();
    expect(invoke).toHaveBeenCalledWith('check_update');
  });

  it.each([
    ['an os error', 'error sending request: os error 61'],
    ['a dns failure', 'failed to lookup address: DNS error'],
    ['a refused connection', 'Connection refused'],
    ['a network failure', 'Network is unreachable'],
  ])(
    'rejects as UpdateCheckError with the reason network for %s',
    async (_name, message) => {
      const { checkUpdate } = await import('../updaterService');
      invoke.mockRejectedValue(new Error(message));

      await expect(checkUpdate()).rejects.toMatchObject({
        name: 'UpdateCheckError',
        reason: 'network',
      });
    },
  );

  it('rejects as UpdateCheckError with the reason server for any other failure', async () => {
    const { checkUpdate } = await import('../updaterService');
    invoke.mockRejectedValue(new Error('signature verification failed'));

    await expect(checkUpdate()).rejects.toMatchObject({
      name: 'UpdateCheckError',
      reason: 'server',
    });
  });
});

describe('downloadUpdate', () => {
  it('hands the progress channel to download_update as onEvent', async () => {
    const { downloadUpdate } = await import('../updaterService');
    const onProgress = {} as IpcChannel<DownloadProgressEvent>;

    await downloadUpdate(onProgress);

    expect(invoke).toHaveBeenCalledWith('download_update', {
      onEvent: onProgress,
    });
  });

  it('rejects as UpdateDownloadError when the download fails', async () => {
    const { downloadUpdate } = await import('../updaterService');
    invoke.mockRejectedValue(new Error('disk full'));

    await expect(
      downloadUpdate({} as IpcChannel<DownloadProgressEvent>),
    ).rejects.toMatchObject({ name: 'UpdateDownloadError' });
  });
});

describe('installAndRelaunch', () => {
  it('invokes install_and_relaunch', async () => {
    const { installAndRelaunch } = await import('../updaterService');

    await installAndRelaunch();

    expect(invoke).toHaveBeenCalledWith('install_and_relaunch');
  });

  it('rejects as UpdateInstallAndRelaunchError when the install fails', async () => {
    const { installAndRelaunch } = await import('../updaterService');
    invoke.mockRejectedValue(new Error('No downloaded update available'));

    await expect(installAndRelaunch()).rejects.toMatchObject({
      name: 'UpdateInstallAndRelaunchError',
    });
  });
});
