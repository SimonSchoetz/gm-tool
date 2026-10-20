// Node host — imported by vite.config.ts and bundled into Vite's config by its loader, which is why it imports ../db/_migrations, ../domain/images and this folder's files by relative path: the bundle resolves no path alias.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import type { ServerResponse } from 'node:http';
import { homedir, tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { z } from 'zod';
import { runMigrations } from '../db/_migrations';
import { IMAGE_FILE_EXTENSIONS, isImageFileExtension } from '../domain/images';
import {
  answerCommand,
  createFixtureCycle,
  type CommandContext,
} from './commands';
import {
  assertInstalledAppData,
  copyDatabase,
  copyImages,
  INSTALLED_DATABASE_FILE,
  resolveInstalledAppDataDir,
} from './installedAppData';
import {
  DEV_DATA_SERVER_PREFIX,
  DEV_DATA_SERVER_ROUTES,
  type DialogOpenRequest,
  type DialogOpenResponse,
  type ErrorResponse,
  type InvokeRequest,
  type InvokeResponse,
  type SqlExecuteResponse,
  type SqlRequest,
  type VersionResponse,
} from './protocol';
import {
  isAllowedHost,
  isJsonContentType,
  isSafeImageFileName,
  MAX_JSON_BODY_BYTES,
  readJsonBody,
  requestRejectionError,
  type RequestRejectionError,
} from './requestGuard';
import { openSqliteDatabase } from './sqliteDatabase';

type DevDataContext = CommandContext & {
  nextFixture: (extensions: readonly string[]) => string | null;
  version: string;
};

const sqlRequestSchema = z.object({
  query: z.string(),
  bindValues: z.array(z.unknown()),
}) satisfies z.ZodType<SqlRequest>;
const invokeRequestSchema = z.object({
  args: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<InvokeRequest>;
const dialogOpenRequestSchema = z.object({
  extensions: z.array(z.string()),
}) satisfies z.ZodType<DialogOpenRequest>;
const packageJsonSchema = z.object({ version: z.string() });

const IMAGE_CONTENT_TYPES: Record<
  (typeof IMAGE_FILE_EXTENSIONS)[number],
  string
> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const TEMP_DIR_NAME = 'gm-tool-web-mode';

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const sendEmpty = (res: ServerResponse, status: number): void => {
  res.statusCode = status;
  res.end();
};

const parseBody = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw requestRejectionError(400, result.error.message);
  }
  return result.data;
};

const readPostBody = async (req: Connect.IncomingMessage): Promise<unknown> => {
  if (!isJsonContentType(req.headers['content-type'])) {
    throw requestRejectionError(
      415,
      'A POST to the dev data server carries application/json',
    );
  }
  const read = await readJsonBody(req, MAX_JSON_BODY_BYTES);
  if (!read.ok) {
    throw requestRejectionError(
      read.status,
      read.status === 413
        ? `The body exceeds ${MAX_JSON_BODY_BYTES} bytes`
        : 'The body is not valid JSON',
    );
  }
  return read.body;
};

const errorMessage = (value: unknown): string =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof value.message === 'string'
    ? value.message
    : String(value);

const errorStatus = (value: unknown): number =>
  typeof value === 'object' &&
  value !== null &&
  'name' in value &&
  value.name === 'RequestRejectionError'
    ? (value as RequestRejectionError).status
    : 500;

const serveImage = (
  res: ServerResponse,
  file: string,
  imagesDir: string,
): void => {
  if (!isSafeImageFileName(file)) {
    throw requestRejectionError(400, `Unsafe image file name: ${file}`);
  }
  const extension = extname(file).slice(1);
  const path = join(imagesDir, file);
  if (!isImageFileExtension(extension) || !existsSync(path)) {
    sendEmpty(res, 404);
    return;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', IMAGE_CONTENT_TYPES[extension]);
  res.setHeader('Cache-Control', 'no-store');
  res.end(readFileSync(path));
};

const handle = async (
  req: Connect.IncomingMessage,
  res: ServerResponse,
  route: string,
  context: DevDataContext,
): Promise<void> => {
  if (!isAllowedHost(req.headers.host)) {
    throw requestRejectionError(
      403,
      'The dev data server answers loopback hosts only',
    );
  }
  const method = req.method ?? 'GET';
  if (method === 'GET') {
    if (route === DEV_DATA_SERVER_ROUTES.health) {
      sendEmpty(res, 204);
      return;
    }
    if (route === DEV_DATA_SERVER_ROUTES.version) {
      sendJson(res, 200, {
        version: context.version,
      } satisfies VersionResponse);
      return;
    }
    if (route.startsWith(DEV_DATA_SERVER_ROUTES.images)) {
      serveImage(
        res,
        route.slice(DEV_DATA_SERVER_ROUTES.images.length),
        context.imagesDir,
      );
      return;
    }
  }
  if (method === 'POST') {
    if (route === DEV_DATA_SERVER_ROUTES.sqlExecute) {
      const { query, bindValues } = parseBody(
        sqlRequestSchema,
        await readPostBody(req),
      );
      const { rowsAffected, lastInsertId } = await context.db.execute(
        query,
        bindValues,
      );
      // plugin-sql leaves `lastInsertId` optional for Postgres; the adapter always sets it, and SQLite's last_insert_rowid() is 0 when nothing was inserted.
      sendJson(res, 200, {
        rowsAffected,
        lastInsertId: lastInsertId ?? 0,
      } satisfies SqlExecuteResponse);
      return;
    }
    if (route === DEV_DATA_SERVER_ROUTES.sqlSelect) {
      const { query, bindValues } = parseBody(
        sqlRequestSchema,
        await readPostBody(req),
      );
      sendJson(res, 200, await context.db.select<unknown[]>(query, bindValues));
      return;
    }
    if (route.startsWith(DEV_DATA_SERVER_ROUTES.invoke)) {
      const command = route.slice(DEV_DATA_SERVER_ROUTES.invoke.length);
      const { args } = parseBody(invokeRequestSchema, await readPostBody(req));
      sendJson(res, 200, {
        result: await answerCommand(command, args, context),
      } satisfies InvokeResponse);
      return;
    }
    if (route === DEV_DATA_SERVER_ROUTES.dialogOpen) {
      const { extensions } = parseBody(
        dialogOpenRequestSchema,
        await readPostBody(req),
      );
      sendJson(res, 200, {
        path: context.nextFixture(extensions),
      } satisfies DialogOpenResponse);
      return;
    }
  }
  sendEmpty(res, 404);
};

export const createRequestHandler =
  (context: DevDataContext): Connect.NextHandleFunction =>
  (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith(DEV_DATA_SERVER_PREFIX)) {
      next();
      return;
    }
    const route = url.slice(DEV_DATA_SERVER_PREFIX.length).split('?')[0];
    // A Connect middleware returns void, so the async work starts here and its rejection is answered by this catch; an async middleware would trip @typescript-eslint/no-misused-promises.
    handle(req, res, route, context).catch((error: unknown) => {
      sendJson(res, errorStatus(error), {
        error: errorMessage(error),
      } satisfies ErrorResponse);
    });
  };

export const devDataServer = (): Plugin => {
  let active = false;
  return {
    name: 'gm-tool-dev-data-server',
    configResolved(config) {
      active = config.command === 'serve' && config.mode === 'web';
      if (
        active &&
        config.server.host !== false &&
        config.server.host !== 'localhost'
      ) {
        throw new Error(
          `The dev data server serves the installed app's data and runs on a loopback host only; server.host is ${String(config.server.host)} — remove --host or set it to localhost.`,
        );
      }
    },
    async configureServer(server) {
      if (!active) return;
      const sourceDir = resolveInstalledAppDataDir(process.platform, homedir());
      assertInstalledAppData(sourceDir);
      const tempDir = join(tmpdir(), TEMP_DIR_NAME);
      rmSync(tempDir, { recursive: true, force: true });
      mkdirSync(tempDir, { recursive: true });
      copyDatabase(sourceDir, tempDir);
      copyImages(sourceDir, tempDir);
      const db = openSqliteDatabase(join(tempDir, INSTALLED_DATABASE_FILE));
      // The test support's `skipBackup` is this same no-op, but its module resolves `@db/_migrations`, an alias the config bundle cannot resolve.
      await runMigrations(db, () => Promise.resolve());
      const { version } = packageJsonSchema.parse(
        JSON.parse(
          readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8'),
        ),
      );
      const fixturesDir = resolve(import.meta.dirname, 'fixtures/images');
      const fixturePaths = readdirSync(fixturesDir)
        .sort()
        .map((name) => join(fixturesDir, name));
      server.middlewares.use(
        createRequestHandler({
          db,
          imagesDir: join(tempDir, 'images'),
          fixturePaths,
          nextFixture: createFixtureCycle(fixturePaths),
          version,
        }),
      );
    },
  };
};
