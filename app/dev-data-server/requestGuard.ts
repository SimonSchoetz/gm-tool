// Node host — imported by vitePlugin.ts and commands.ts: the pure checks every request to the dev data server passes before it reaches the database, the images or a command.
import type { Readable } from 'node:stream';
// Relative rather than `@domain`: Vite's config bundle, which loads this file, resolves no path alias.
import { IMAGE_FILE_EXTENSIONS } from '../domain/images';

const ALLOWED_HOSTS: readonly string[] = ['localhost', '127.0.0.1', '[::1]'];

export const isAllowedHost = (hostHeader?: string): boolean =>
  !!hostHeader && ALLOWED_HOSTS.includes(hostHeader.replace(/:\d+$/, ''));

export const isJsonContentType = (header?: string): boolean =>
  (header ?? '').split(';')[0].trim().toLowerCase() === 'application/json';

export const MAX_JSON_BODY_BYTES = 64 * 1024 * 1024;

export const readJsonBody = async (
  req: Readable,
  maxBytes: number,
): Promise<{ ok: true; body: unknown } | { ok: false; status: 400 | 413 }> => {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const bytes = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    total += bytes.length;
    // Past the cap the rest is drained and dropped, so the socket is consumed but nothing more is held in memory.
    if (total <= maxBytes) {
      chunks.push(bytes);
    }
  }
  if (total > maxBytes) {
    return { ok: false, status: 413 };
  }
  try {
    return {
      ok: true,
      body: JSON.parse(Buffer.concat(chunks).toString('utf8')),
    };
  } catch {
    return { ok: false, status: 400 };
  }
};

const SAFE_IMAGE_FILE_NAME = new RegExp(
  `^[A-Za-z0-9_-]+(\\.(${IMAGE_FILE_EXTENSIONS.join('|')}))?$`,
);

export const isSafeImageFileName = (name: string): boolean =>
  SAFE_IMAGE_FILE_NAME.test(name);

export const isFixturePath = (
  sourcePath: unknown,
  fixturePaths: readonly string[],
): sourcePath is string =>
  typeof sourcePath === 'string' && fixturePaths.includes(sourcePath);

export type RequestRejectionError = Error & {
  name: 'RequestRejectionError';
  status: 400 | 403 | 413 | 415;
};

export const requestRejectionError = (
  status: 400 | 403 | 413 | 415,
  message: string,
): RequestRejectionError => {
  const error = new Error(message) as RequestRejectionError;
  error.name = 'RequestRejectionError';
  error.status = status;
  return error;
};
