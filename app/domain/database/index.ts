// The `.ts` extension lets `node` load this barrel: the dev data mirror runs under Node's type stripping, which resolves no extensionless specifier (app/dev-data-server/CLAUDE.md — Imports).
export { DATABASE_FILE, DEVICE_SYSTEM_KEY } from './databaseNames.ts';
