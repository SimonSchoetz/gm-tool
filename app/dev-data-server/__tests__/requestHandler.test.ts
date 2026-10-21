// @vitest-environment node
import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createServer, request, type Server } from 'node:http';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createFixtureCycle } from '../fixtureCycle';
import { DEV_DATA_SERVER_PREFIX, DEV_DATA_SERVER_ROUTES } from '../protocol';
import { MAX_JSON_BODY_BYTES } from '../requestGuard';
import { openSqliteDatabase } from '../sqliteDatabase';
import { createRequestHandler } from '../requestHandler';
import { createTempDirectory } from './support/tempDirectory';

const FIXTURES_DIR = resolve(import.meta.dirname, '../fixtures/images');
const fixturePaths = readdirSync(FIXTURES_DIR)
  .sort()
  .map((name) => join(FIXTURES_DIR, name));
const VERSION = '9.9.9';
const next = vi.fn();
const fixtureCycle = createFixtureCycle(fixturePaths);
// What the handler's `nextFixture` does; a test that needs the handler to meet a rejection of its own making swaps it and restores `fixtureCycle`.
let nextFixture: (extensions: readonly string[]) => string | null =
  fixtureCycle;

let temp: ReturnType<typeof createTempDirectory>;
let server: Server;
let port: number;
let imagesDir: string;

const url = (route: string) =>
  `http://127.0.0.1:${port}${DEV_DATA_SERVER_PREFIX}${route}`;

const postRaw = (route: string, body: string) =>
  fetch(url(route), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

const postJson = (route: string, body: unknown) =>
  postRaw(route, JSON.stringify(body));

const errorOf = async (response: Response): Promise<string> =>
  ((await response.json()) as { error: string }).error;

const answerWithHost = (
  host: string,
): Promise<{ status: number; body: string }> =>
  new Promise((resolveAnswer, reject) => {
    const req = request(
      {
        host: '127.0.0.1',
        port,
        path: `${DEV_DATA_SERVER_PREFIX}${DEV_DATA_SERVER_ROUTES.health}`,
        headers: { Host: host },
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          body += chunk;
        });
        res.on('end', () => {
          resolveAnswer({ status: res.statusCode ?? 0, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });

beforeAll(async () => {
  temp = createTempDirectory();
  imagesDir = join(temp.dir, 'images');
  mkdirSync(imagesDir);
  const db = openSqliteDatabase(':memory:');
  const handler = createRequestHandler({
    db,
    imagesDir,
    fixturePaths,
    nextFixture: (extensions) => nextFixture(extensions),
    version: VERSION,
  });
  server = createServer((req, res) => {
    handler(req, res, () => {
      next();
      res.statusCode = 599;
      res.end();
    });
  });
  await new Promise<void>((resolveListening) => {
    server.listen(0, '127.0.0.1', resolveListening);
  });
  const address = server.address();
  if (typeof address !== 'object' || address === null) {
    throw new Error('The test server has no port');
  }
  port = address.port;
});

afterAll(async () => {
  await new Promise<void>((resolveClosed) => {
    server.close(() => {
      resolveClosed();
    });
  });
  temp.remove();
});

describe('createRequestHandler', () => {
  it('passes a request outside the prefix to next', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/somewhere-else`);

    expect(response.status).toBe(599);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('answers health with 204 and version with the given version', async () => {
    const health = await fetch(url(DEV_DATA_SERVER_ROUTES.health));
    expect(health.status).toBe(204);

    const version = await fetch(url(DEV_DATA_SERVER_ROUTES.version));
    expect(version.status).toBe(200);
    expect(version.headers.get('content-type')).toBe('application/json');
    await expect(version.json()).resolves.toEqual({ version: VERSION });
  });

  it('runs execute and select against the adapter and answers their results', async () => {
    const created = await postJson(DEV_DATA_SERVER_ROUTES.sqlExecute, {
      query: 'CREATE TABLE t (a TEXT)',
      bindValues: [],
    });
    expect(created.status).toBe(200);
    await expect(created.json()).resolves.toEqual({
      rowsAffected: 0,
      lastInsertId: 0,
    });

    const inserted = await postJson(DEV_DATA_SERVER_ROUTES.sqlExecute, {
      query: 'INSERT INTO t (a) VALUES ($1)',
      bindValues: ['row'],
    });
    await expect(inserted.json()).resolves.toEqual({
      rowsAffected: 1,
      lastInsertId: 1,
    });

    const selected = await postJson(DEV_DATA_SERVER_ROUTES.sqlSelect, {
      query: 'SELECT a FROM t WHERE a = $1',
      bindValues: ['row'],
    });
    expect(selected.status).toBe(200);
    await expect(selected.json()).resolves.toEqual([{ a: 'row' }]);
  });

  it('forwards invoke to the command table, mapping a rejection to 500 with its message and a request rejection to its status', async () => {
    const peers = await postJson(
      `${DEV_DATA_SERVER_ROUTES.invoke}get_connected_peers`,
      { args: {} },
    );
    expect(peers.status).toBe(200);
    await expect(peers.json()).resolves.toEqual({ result: [] });

    const download = await postJson(
      `${DEV_DATA_SERVER_ROUTES.invoke}download_update`,
      { args: {} },
    );
    expect(download.status).toBe(500);
    await expect(download.json()).resolves.toEqual({
      error: 'download_update is not available in web mode',
    });

    const foreign = await postJson(
      `${DEV_DATA_SERVER_ROUTES.invoke}save_image`,
      {
        args: { id: 'img', extension: 'png', sourcePath: '/etc/hosts' },
      },
    );
    expect(foreign.status).toBe(400);
    expect(readdirSync(imagesDir)).toEqual([]);
  });

  it.each([
    ['a string', 'plain failure', 'plain failure'],
    ['null', null, 'null'],
    [
      'an object whose message is no string',
      { message: 42 },
      '[object Object]',
    ],
  ])(
    'answers 500 with the text of %s the handler meets as a rejection',
    async (_label, thrown, expected) => {
      nextFixture = () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- the handler's catch must answer whatever a collaborator throws, an Error or not
        throw thrown;
      };
      try {
        const response = await postJson(DEV_DATA_SERVER_ROUTES.dialogOpen, {
          extensions: ['png'],
        });

        expect(response.status).toBe(500);
        await expect(errorOf(response)).resolves.toBe(expected);
      } finally {
        nextFixture = fixtureCycle;
      }
    },
  );

  it('answers 400 naming invalid JSON for a body that does not parse', async () => {
    const response = await postRaw(
      DEV_DATA_SERVER_ROUTES.sqlSelect,
      '{"query":',
    );

    expect(response.status).toBe(400);
    await expect(errorOf(response)).resolves.toMatch(/not valid JSON/);
  });

  it('answers 413 naming the cap for a body one byte over it, after reading the whole body', async () => {
    const response = await postRaw(
      DEV_DATA_SERVER_ROUTES.sqlSelect,
      ' '.repeat(MAX_JSON_BODY_BYTES + 1),
    );

    expect(response.status).toBe(413);
    await expect(errorOf(response)).resolves.toBe(
      `The body exceeds ${MAX_JSON_BODY_BYTES} bytes`,
    );
  });

  it('answers 400 for a well-formed JSON body of the wrong shape', async () => {
    const response = await postJson(DEV_DATA_SERVER_ROUTES.sqlSelect, {
      query: 'SELECT 1',
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('bindValues');
  });

  it('answers 403 naming the loopback rule for a foreign Host before any route', async () => {
    const foreign = await answerWithHost('evil.example');
    expect(foreign.status).toBe(403);
    expect((JSON.parse(foreign.body) as { error: string }).error).toMatch(
      /loopback/,
    );
    await expect(answerWithHost(`localhost:${port}`)).resolves.toMatchObject({
      status: 204,
    });
  });

  it('answers 415 naming JSON for a POST that is not JSON', async () => {
    const text = await fetch(url(DEV_DATA_SERVER_ROUTES.sqlSelect), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'SELECT 1',
    });

    expect(text.status).toBe(415);
    await expect(errorOf(text)).resolves.toMatch(/application\/json/);
  });

  it('answers 404 for an unknown route and for a route asked with the other method', async () => {
    for (const path of ['/nothing-here', '/nothing/here']) {
      expect((await fetch(url(path))).status).toBe(404);
      expect((await postJson(path, { extensions: [] })).status).toBe(404);
    }
    const getOnPost = await fetch(url(DEV_DATA_SERVER_ROUTES.sqlSelect));
    expect(getOnPost.status).toBe(404);
    const postOnGet = await postJson(DEV_DATA_SERVER_ROUTES.health, {});
    expect(postOnGet.status).toBe(404);
  });

  it('serves an image with its content type and no-store, 404 when absent and 400 for an unsafe name', async () => {
    copyFileSync(fixturePaths[0], join(imagesDir, 'served.png'));

    const served = await fetch(
      url(`${DEV_DATA_SERVER_ROUTES.images}served.png`),
    );
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
    expect(served.headers.get('cache-control')).toBe('no-store');
    expect(Buffer.from(await served.arrayBuffer())).toEqual(
      readFileSync(fixturePaths[0]),
    );

    const absent = await fetch(
      url(`${DEV_DATA_SERVER_ROUTES.images}absent.png`),
    );
    expect(absent.status).toBe(404);

    const unsafe = await fetch(
      url(`${DEV_DATA_SERVER_ROUTES.images}served.svg`),
    );
    expect(unsafe.status).toBe(400);
    await expect(errorOf(unsafe)).resolves.toMatch(/served\.svg$/);
  });

  it.each([
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['webp', 'image/webp'],
    ['gif', 'image/gif'],
  ])('serves a .%s image as %s', async (extension, contentType) => {
    copyFileSync(fixturePaths[0], join(imagesDir, `typed.${extension}`));

    const served = await fetch(
      url(`${DEV_DATA_SERVER_ROUTES.images}typed.${extension}`),
    );

    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe(contentType);
  });

  it('answers dialog/open with the next fixture for the asked extensions', async () => {
    const response = await postJson(DEV_DATA_SERVER_ROUTES.dialogOpen, {
      extensions: ['jpg'],
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      path: fixturePaths.find((path) => path.endsWith('.jpg')) ?? null,
    });
  });
});
