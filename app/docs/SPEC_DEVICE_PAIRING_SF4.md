# SF4: devicesService

Business logic composing the DB layer (SF2), domain vocabulary (SF3), and the Rust commands (SF1). Follows every convention in `app/services/CLAUDE.md`: one file, namespace DB imports, every exported function wraps its calls in try/catch and throws a typed domain error.

## Files Affected

New:

- `app/services/devicesService.ts`

## Imports

```ts
import { invoke } from '@tauri-apps/api/core';
import * as pairedDeviceDb from '@db/paired-device';
import { getDevice, updateDevice, type DeviceData } from '@db/_system';
import {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  deviceMessageEnvelopeSchema,
  devicesLoadError,
  deviceCreateError,
  deviceUpdateError,
  deviceDeleteError,
  connectivityInitError,
  pairingModeError,
  pairingConfirmError,
  deviceMessageError,
} from '@domain';
```

Plus `type { PairedDevice }` from `@db/paired-device`.

## Functions

All `async`. Error mapping: each function's try/catch throws the domain error named with it; nothing re-throws raw errors.

**`initializeConnectivity(): Promise<void>`** — throws `connectivityInitError`. Steps: `const peers = await pairedDeviceDb.getAll()`; `const stored = await getDevice()`; `const id = await invoke<string>('init_connectivity', { ownName: stored?.name ?? null, trustedPeers: peers.map((p) => ({ endpointId: p.id, name: p.name ?? null })) })`; `await updateDevice({ id, name: stored?.name ?? null })`. The `_system` write runs on every init (not only the first): the Rust key file is the identity source of truth, so a divergent stored id (e.g. after the key file was deleted) self-heals here.

**`getOwnDevice(): Promise<DeviceData | null>`** — throws `devicesLoadError`. Thin wrapper over `getDevice()`; `null` before first init is a valid state the UI handles.

**`getPairedDevices(): Promise<PairedDevice[]>`** — throws `devicesLoadError`. Wraps `pairedDeviceDb.getAll()`.

**`getConnectedPeers(): Promise<string[]>`** — throws `devicesLoadError`. Wraps `invoke<string[]>('get_connected_peers')`.

**`renameOwnDevice(name: string | null): Promise<void>`** — throws `deviceUpdateError`. Steps: `const stored = await getDevice()`; if `stored === null` throw (rename before init is impossible through the UI, but the guard keeps the contract honest — include the reason in the error cause); `await updateDevice({ id: stored.id, name })`; `await invoke('update_own_name', { name })` (refreshes the pairing-hello name cache in Rust, defined in SF1); then broadcast: `const connected = await invoke<string[]>('get_connected_peers')`; for each peer id, `await invoke('send_message', { endpointId, envelope: JSON.stringify(buildNameUpdateEnvelope(name)) })` with per-peer failures swallowed (a peer disconnecting mid-broadcast must not fail the rename — the peer will receive `hello` on next connect).

**`sendHello(endpointId: string): Promise<void>`** — throws `deviceMessageError`. `const stored = await getDevice()`; send `buildHelloEnvelope(stored?.name ?? null)` via `send_message` to that peer. Called by SF5's lifecycle on every `peer-connected` event (both sides announce on connect).

**`enterPairingMode(): Promise<string>`** — throws `pairingModeError`. Wraps `invoke<string>('enter_pairing_mode')`, returns the 6-digit code.

**`exitPairingMode(): Promise<void>`** — throws `pairingModeError`. Wraps the invoke.

**`submitPairingCode(endpointId: string, code: string): Promise<void>`** — throws `pairingConfirmError`. Wraps the invoke. The thrown error's message carries the Rust `Err` string (wrong code vs. timeout) — SF7 displays `pairingConfirmError`'s message inline.

**`completePairing(endpointId: string, name: string | null): Promise<void>`** — throws `deviceCreateError`. Wraps `pairedDeviceDb.create({ id: endpointId, name })`. Called by SF5's lifecycle on the `pairing-succeeded` event. Guard: if `pairedDeviceDb.get(endpointId)` already returns a row, return without inserting — both sides emit `pairing-succeeded`, and StrictMode double-subscription in dev can deliver the event twice.

**`forgetDevice(endpointId: string): Promise<void>`** — throws `deviceDeleteError`. Steps, in order: (1) best-effort `invoke('send_message', { endpointId, envelope: JSON.stringify(buildUnpairEnvelope()) })` with the failure swallowed — the peer may be offline and the unpair guarantee is local-first (root spec KAD "Unpair is reciprocal and best-effort"); (2) `await invoke('remove_trusted_peer', { endpointId })`; (3) `await pairedDeviceDb.remove(endpointId)`.

**`handlePeerMessage(endpointId: string, rawEnvelope: string): Promise<'ignored' | 'devices-changed'>`** — throws `deviceUpdateError`. The single entry point for incoming messages (SF5 lifecycle calls it and invalidates the paired-devices query when the result is `'devices-changed'`). Logic:

1. `JSON.parse(rawEnvelope)` inside its own try — a malformed frame returns `'ignored'` (never throws; hostile or future peers must not crash the app).
2. `deviceMessageEnvelopeSchema.safeParse(...)` — on failure return `'ignored'` (forward-compatibility contract from SF3).
3. `hello` / `name-update`: `const existing = await pairedDeviceDb.get(endpointId)`; if `existing === null` return `'ignored'` (a message from an untrusted id cannot reach here through SF1's ALPN gate, but a row deleted mid-session can race — do not resurrect it); if `existing.name === payload.name` return `'ignored'`; else `await pairedDeviceDb.update(endpointId, { name: payload.name })` and return `'devices-changed'`.
4. `unpair`: `await invoke('remove_trusted_peer', { endpointId })`; `await pairedDeviceDb.remove(endpointId)`; return `'devices-changed'`.

## Cross-SF Wiring

Every export is consumed by SF5's hooks (`useOwnDevice`, `usePairedDevices`, `useConnectedPeers`, `useConnectivityLifecycle`) or SF7's pairing mutations, all named in those SFs. No same-SF consumers — services have no test convention in this repo (none exist for any service), so this SF adds no test files.
