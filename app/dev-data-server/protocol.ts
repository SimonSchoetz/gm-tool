// Browser-safe: the constants and types of the dev data server's HTTP contract, imported by platform/webPlatform.ts in the browser bundle and by the server files beside it. This folder has no index.ts because a barrel of both hosts' files would pull node:sqlite and node:fs into the browser bundle, and a barrel of one host's file would make the other's import reach past it (app/CLAUDE.md — Directory Structure).
export const DEV_DATA_SERVER_PREFIX = '/__dev-data';

export const DEV_DATA_SERVER_ROUTES = {
  health: '/health',
  version: '/version',
  sqlExecute: '/sql/execute',
  sqlSelect: '/sql/select',
  invoke: '/invoke/',
  dialogOpen: '/dialog/open',
  images: '/images/',
} as const;

export type SqlRequest = { query: string; bindValues: unknown[] };
export type SqlExecuteResponse = { rowsAffected: number; lastInsertId: number };
export type InvokeRequest = { args: Record<string, unknown> };
export type InvokeResponse = { result: unknown };
export type ErrorResponse = { error: string };
export type DialogOpenRequest = { extensions: readonly string[] };
export type DialogOpenResponse = { path: string | null };
export type VersionResponse = { version: string };
