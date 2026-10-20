import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEV_DATA_SERVER_PREFIX,
  DEV_DATA_SERVER_ROUTES,
} from '../../dev-data-server/protocol';
import {
  UNREACHABLE_DEV_DATA_SERVER_MESSAGE,
  webPlatform,
} from '../webPlatform';

const fetchSpy = vi.fn<typeof fetch>();

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const healthy = () => new Response(null, { status: 204 });
const url = (route: string) => `${DEV_DATA_SERVER_PREFIX}${route}`;
const jsonPost = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchSpy.mockReset();
});

describe('webPlatform.loadDatabase', () => {
  it('rejects with the unreachable message when the health request fails', async () => {
    fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(webPlatform.loadDatabase('gm_tool.db')).rejects.toThrow(
      UNREACHABLE_DEV_DATA_SERVER_MESSAGE,
    );
  });

  it("rejects with the unreachable message when health answers 200, Vite's SPA fallback", async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('<!doctype html>', { status: 200 }),
    );

    await expect(webPlatform.loadDatabase('gm_tool.db')).rejects.toThrow(
      UNREACHABLE_DEV_DATA_SERVER_MESSAGE,
    );
    expect(fetchSpy).toHaveBeenCalledWith(url(DEV_DATA_SERVER_ROUTES.health));
  });

  it('posts execute and select to their routes with the bind values, [] when omitted, and resolves the parsed body', async () => {
    fetchSpy
      .mockResolvedValueOnce(healthy())
      .mockResolvedValueOnce(
        jsonResponse(200, { rowsAffected: 1, lastInsertId: 7 }),
      )
      .mockResolvedValueOnce(jsonResponse(200, [{ a: 'row' }]));
    const db = await webPlatform.loadDatabase('gm_tool.db');

    await expect(db.execute('CREATE TABLE t (a TEXT)')).resolves.toEqual({
      rowsAffected: 1,
      lastInsertId: 7,
    });
    await expect(
      db.select('SELECT a FROM t WHERE a = $1', ['row']),
    ).resolves.toEqual([{ a: 'row' }]);

    expect(db.path).toBe('gm_tool.db');
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      url(DEV_DATA_SERVER_ROUTES.sqlExecute),
      jsonPost({ query: 'CREATE TABLE t (a TEXT)', bindValues: [] }),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      3,
      url(DEV_DATA_SERVER_ROUTES.sqlSelect),
      jsonPost({ query: 'SELECT a FROM t WHERE a = $1', bindValues: ['row'] }),
    );
    await expect(db.close()).resolves.toBe(true);
  });
});

describe('webPlatform.invoke', () => {
  it('posts the args to invoke/<command> and resolves the result', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { result: 42 }));

    await expect(
      webPlatform.invoke<number>('save_image', { id: 'img' }),
    ).resolves.toBe(42);
    expect(fetchSpy).toHaveBeenCalledWith(
      url(`${DEV_DATA_SERVER_ROUTES.invoke}save_image`),
      jsonPost({ args: { id: 'img' } }),
    );
  });

  it('posts empty args when none are given', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { result: [] }));

    await webPlatform.invoke('get_connected_peers');

    expect(fetchSpy).toHaveBeenCalledWith(
      url(`${DEV_DATA_SERVER_ROUTES.invoke}get_connected_peers`),
      jsonPost({ args: {} }),
    );
  });

  it("rejects a non-2xx answer with an Error carrying the server's error string", async () => {
    fetchSpy.mockResolvedValueOnce(
      jsonResponse(500, {
        error: 'download_update is not available in web mode',
      }),
    );

    await expect(webPlatform.invoke('download_update')).rejects.toThrow(
      new Error('download_update is not available in web mode'),
    );
  });
});

describe('webPlatform.pickFile', () => {
  it('posts the extensions to dialog/open and resolves the path, null included', async () => {
    fetchSpy
      .mockResolvedValueOnce(jsonResponse(200, { path: '/fixtures/a.png' }))
      .mockResolvedValueOnce(jsonResponse(200, { path: null }));

    await expect(
      webPlatform.pickFile({ extensions: ['png', 'jpg'] }),
    ).resolves.toBe('/fixtures/a.png');
    await expect(webPlatform.pickFile({ extensions: ['gif'] })).resolves.toBe(
      null,
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      url(DEV_DATA_SERVER_ROUTES.dialogOpen),
      jsonPost({ extensions: ['png', 'jpg'] }),
    );
  });
});

describe('webPlatform.getVersion', () => {
  it('reads the version route', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse(200, { version: '1.2.3' }));

    await expect(webPlatform.getVersion()).resolves.toBe('1.2.3');
    expect(fetchSpy).toHaveBeenCalledWith(url(DEV_DATA_SERVER_ROUTES.version));
  });
});

describe('webPlatform.openUrl', () => {
  it('opens the URL in a new tab without a reference back to the app', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    await webPlatform.openUrl('https://example.test/page');

    expect(open).toHaveBeenCalledWith(
      'https://example.test/page',
      '_blank',
      'noopener',
    );
    open.mockRestore();
  });
});
