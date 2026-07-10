# SF3: Domain Vocabulary — Devices

Adds the `domain/devices/` module: typed errors, the message envelope schemas, and the connectivity event contracts shared by the service and DAL layers. TypeScript only; depends on nothing from this feature (SF2 not required to compile this SF).

## Files Affected

Modified:

- `app/domain/index.ts` — append explicit named re-exports for the new module, following the existing per-module block style (types block + values block)

New:

- `app/domain/devices/errors.ts`
- `app/domain/devices/messages.ts`
- `app/domain/devices/events.ts`
- `app/domain/devices/index.ts`
- `app/domain/devices/__tests__/messages.test.ts`

## `errors.ts`

Factory-function pattern from `app/CLAUDE.md` (reference shape: `domain/updater/errors.ts`). One factory + type per failure mode the service layer (SF4) throws; message prefixes as listed:

| Factory | Type name | Message prefix |
| --- | --- | --- |
| `devicesLoadError` | `DevicesLoadError` | `Failed to load devices: ` |
| `deviceCreateError` | `DeviceCreateError` | `Failed to persist paired device: ` |
| `deviceUpdateError` | `DeviceUpdateError` | `Failed to update device: ` |
| `deviceDeleteError` | `DeviceDeleteError` | `Failed to forget device: ` |
| `connectivityInitError` | `ConnectivityInitError` | `Failed to initialize connectivity: ` |
| `pairingModeError` | `PairingModeError` | `Failed to enter or exit pairing mode: ` |
| `pairingConfirmError` | `PairingConfirmError` | `Pairing confirmation failed: ` |
| `deviceMessageError` | `DeviceMessageError` | `Failed to send device message: ` |

Each factory takes `(cause?: unknown)` and appends `${String(cause)}`, exactly like `updateDownloadError`.

## `messages.ts`

The application message envelope (root spec KAD "Versioned message envelope"). `z.discriminatedUnion` is available in the installed zod [S_6: node_modules/zod/v4/classic/schemas.d.cts:514 — `export declare function discriminatedUnion`].

```ts
import { z } from 'zod';

export const ENVELOPE_VERSION = 1;

const namePayloadSchema = z.object({ name: z.string().nullable() });

export const deviceMessageEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({ v: z.number(), type: z.literal('hello'), payload: namePayloadSchema }),
  z.object({ v: z.number(), type: z.literal('name-update'), payload: namePayloadSchema }),
  z.object({ v: z.number(), type: z.literal('unpair'), payload: z.object({}) }),
]);

export type DeviceMessageEnvelope = z.infer<typeof deviceMessageEnvelopeSchema>;

export const buildHelloEnvelope = (name: string | null): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'hello',
  payload: { name },
});

export const buildNameUpdateEnvelope = (name: string | null): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'name-update',
  payload: { name },
});

export const buildUnpairEnvelope = (): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'unpair',
  payload: {},
});
```

The two name-carrying payloads share one schema const deliberately — same concern (a device announcing its name), not incidental similarity. Consumers parse incoming strings with `deviceMessageEnvelopeSchema.safeParse(JSON.parse(raw))`; a failed parse is the ignore path (forward compatibility), which is why the schema is exported rather than a throwing parse helper.

## `events.ts`

TS mirror of SF1's event contract. The name strings must match SF1's Rust constants exactly.

```ts
export const CONNECTIVITY_EVENTS = {
  peerConnected: 'connectivity-peer-connected',
  peerDisconnected: 'connectivity-peer-disconnected',
  messageReceived: 'connectivity-message-received',
  pairingCandidate: 'connectivity-pairing-candidate',
  pairingCandidateLost: 'connectivity-pairing-candidate-lost',
  pairingSucceeded: 'connectivity-pairing-succeeded',
  pairingFailed: 'connectivity-pairing-failed',
} as const;

export type PeerConnectedPayload = { endpointId: string };
export type PeerDisconnectedPayload = { endpointId: string };
export type MessageReceivedPayload = { endpointId: string; envelope: string };
export type PairingCandidatePayload = { endpointId: string; name: string | null };
export type PairingCandidateLostPayload = { endpointId: string };
export type PairingSucceededPayload = { endpointId: string; name: string | null };
export type PairingFailedPayload = { endpointId: string; reason: string };
```

## `index.ts`

Explicit named exports (module directory barrel; multiple distinct concerns, so no `export *`): every factory and type from `errors.ts`; `ENVELOPE_VERSION`, `deviceMessageEnvelopeSchema`, `DeviceMessageEnvelope`, the three builders from `messages.ts`; `CONNECTIVITY_EVENTS` and all payload types from `events.ts`.

`domain/index.ts` re-exports the same set, following the existing style (a `export type { ... } from './devices'` block and a `export { ... } from './devices'` block appended at the end of the file).

## `__tests__/messages.test.ts`

Validation-rule tests (mirrors the precedent that `domain/` logic carries tests, e.g. `domain/mentions/__tests__/`). No DB mocking needed — pure Zod. Required tests:

1. accepts a built `hello` envelope — `deviceMessageEnvelopeSchema.safeParse(buildHelloEnvelope('Laptop')).success` is `true`
2. accepts a built `name-update` envelope with `null` name
3. accepts a built `unpair` envelope
4. rejects an unknown message type — `safeParse({ v: 1, type: 'sync-batch', payload: {} }).success` is `false` (the forward-compatibility ignore path)
5. rejects a `hello` without a `name` field in the payload
6. round-trips through JSON — `safeParse(JSON.parse(JSON.stringify(buildHelloEnvelope(null)))).success` is `true`

## Cross-SF Wiring

Nothing in this SF has a same-SF consumer. SF4 imports the error factories, envelope builders, and schema; SF5 imports `CONNECTIVITY_EVENTS` and the payload types for its event subscriptions; SF7 imports the pairing payload types. All via `@domain`.
