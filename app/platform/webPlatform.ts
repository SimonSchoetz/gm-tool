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
} from '../dev-data-server/protocol';
import type { Platform } from './types';

export const UNREACHABLE_DEV_DATA_SERVER_MESSAGE =
  "The dev data server is not reachable. Start the app with the `web` launch configuration or run `pnpm run web` from app/ to serve a copy of the installed app's data.";

const fetchJson = async <T>(route: string, init: RequestInit): Promise<T> => {
  const response = await fetch(`${DEV_DATA_SERVER_PREFIX}${route}`, init);
  const parsed: unknown = await response.json();
  if (!response.ok) {
    throw new Error((parsed as ErrorResponse).error);
  }
  return parsed as T;
};

const postJson = <T>(route: string, body: unknown): Promise<T> =>
  fetchJson<T>(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Vite's SPA fallback answers any unknown path with 200 and the app's HTML, so only the health route's own 204 proves the server is there.
const isDevDataServerReachable = async (): Promise<boolean> => {
  try {
    const response = await fetch(
      `${DEV_DATA_SERVER_PREFIX}${DEV_DATA_SERVER_ROUTES.health}`,
    );
    return response.status === 204;
  } catch {
    return false;
  }
};

const OPENABLE_URL_PROTOCOLS: readonly string[] = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
];

const urlProtocol = (url: string): string | null => {
  try {
    return new URL(url).protocol;
  } catch {
    return null;
  }
};

export const webPlatform: Platform = {
  invoke: async <T>(command: string, args?: Record<string, unknown>) => {
    const { result } = await postJson<InvokeResponse>(
      `${DEV_DATA_SERVER_ROUTES.invoke}${command}`,
      { args: args ?? {} } satisfies InvokeRequest,
    );
    return result as T;
  },
  loadDatabase: async (databaseFile) => {
    if (!(await isDevDataServerReachable())) {
      throw new Error(UNREACHABLE_DEV_DATA_SERVER_MESSAGE);
    }
    return {
      path: databaseFile,
      execute: (query, bindValues) =>
        postJson<SqlExecuteResponse>(DEV_DATA_SERVER_ROUTES.sqlExecute, {
          query,
          bindValues: bindValues ?? [],
        } satisfies SqlRequest),
      select: <T>(query: string, bindValues?: unknown[]) =>
        postJson<T>(DEV_DATA_SERVER_ROUTES.sqlSelect, {
          query,
          bindValues: bindValues ?? [],
        } satisfies SqlRequest),
      close: () => Promise.resolve(true),
    };
  },
  // Web mode has no Tauri events: nothing is ever delivered, so there is nothing to unlisten.
  listen: () =>
    Promise.resolve(() => {
      // no event source to detach from
    }),
  createIpcChannel: <T>(onmessage: (message: T) => void) => ({ onmessage }),
  getVersion: async () => {
    const { version } = await fetchJson<VersionResponse>(
      DEV_DATA_SERVER_ROUTES.version,
      { method: 'GET' },
    );
    return version;
  },
  // get_image_url already answers a URL the browser can fetch.
  convertFileSrc: (filePath) => filePath,
  // The Tauri opener plugin's default scope, which the app grants: web mode opens the same URLs and nothing else, in a new tab rather than inside the app's page.
  openUrl: (url) => {
    const protocol = urlProtocol(url);
    if (protocol === null || !OPENABLE_URL_PROTOCOLS.includes(protocol)) {
      return Promise.reject(
        new Error(
          `Web mode opens ${OPENABLE_URL_PROTOCOLS.join(', ')} URLs only; ${protocol === null ? `"${url}" is not a URL` : `the scheme of "${url}" is ${protocol}`}`,
        ),
      );
    }
    window.open(url, '_blank', 'noopener');
    return Promise.resolve();
  },
  pickFile: async ({ extensions }) => {
    const { path } = await postJson<DialogOpenResponse>(
      DEV_DATA_SERVER_ROUTES.dialogOpen,
      { extensions } satisfies DialogOpenRequest,
    );
    return path;
  },
};
