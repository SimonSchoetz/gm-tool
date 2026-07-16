## Sub-feature 2: Domain vocabulary

Adds the TypeScript event key/payload for `CodeRequest`'s relayed event, and the error factory for the new service call. Consumed by Sub-feature 3 (service) and Sub-feature 4 (data access layer) — named explicitly below.

### Files affected

Modified:

- `app/domain/devices/events.ts`
- `app/domain/devices/errors.ts`
- `app/domain/devices/index.ts`
- `app/domain/index.ts`

### Domain

**`app/domain/devices/events.ts`**

Add `pairingCodeRequested` to `CONNECTIVITY_EVENTS`, directly after `pairingCandidateLost` (before `pairingSucceeded`):

```ts
export const CONNECTIVITY_EVENTS = {
  peerConnected: 'connectivity-peer-connected',
  peerDisconnected: 'connectivity-peer-disconnected',
  messageReceived: 'connectivity-message-received',
  pairingCandidate: 'connectivity-pairing-candidate',
  pairingCandidateLost: 'connectivity-pairing-candidate-lost',
  pairingCodeRequested: 'connectivity-pairing-code-requested',
  pairingSucceeded: 'connectivity-pairing-succeeded',
  pairingFailed: 'connectivity-pairing-failed',
} as const;
```

Add the payload type, directly after `PairingCandidateLostPayload` (before `PairingSucceededPayload`):

```ts
export type PairingCodeRequestedPayload = { endpointId: string };
```

Consumed by Sub-feature 4 — `usePairing.ts` imports `PairingCodeRequestedPayload` and reads `CONNECTIVITY_EVENTS.pairingCodeRequested`.

**`app/domain/devices/errors.ts`**

Add a `PairingRequestError`/`pairingRequestError` factory directly after `pairingConfirmError`, same shape as the other factories in this file:

```ts
export type PairingRequestError = Error & { name: 'PairingRequestError' };
export const pairingRequestError = (cause?: unknown): PairingRequestError => {
  const error = new Error(
    `Failed to request pairing code: ${String(cause)}`,
  ) as PairingRequestError;
  error.name = 'PairingRequestError';
  return error;
};
```

Consumed by Sub-feature 3 — `devicesService.ts` imports `pairingRequestError`. Consumed by Sub-feature 4 — `usePairing.ts` imports the `PairingRequestError` type.

**`app/domain/devices/index.ts`**

Add `PairingRequestError` to the type export list (alphabetically after `PairingModeError`) and `PairingCodeRequestedPayload` to the events type export list (alphabetically after `PairingCandidatePayload`); add `pairingRequestError` to the value export list (alphabetically after `pairingModeError`):

```ts
export type {
  ConnectivityInitError,
  DeviceCreateError,
  DeviceDeleteError,
  DeviceMessageError,
  DevicesLoadError,
  DeviceUpdateError,
  PairingConfirmError,
  PairingModeError,
  PairingRequestError,
} from './errors';
export {
  connectivityInitError,
  deviceCreateError,
  deviceDeleteError,
  deviceMessageError,
  devicesLoadError,
  deviceUpdateError,
  pairingConfirmError,
  pairingModeError,
  pairingRequestError,
} from './errors';
export type { DeviceMessageEnvelope } from './messages';
export {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  deviceMessageEnvelopeSchema,
  ENVELOPE_VERSION,
} from './messages';
export { ENDPOINT_ID_HEX_REGEX } from './identity';
export type {
  MessageReceivedPayload,
  PairingCandidateLostPayload,
  PairingCandidatePayload,
  PairingCodeRequestedPayload,
  PairingFailedPayload,
  PairingSucceededPayload,
  PeerConnectedPayload,
  PeerDisconnectedPayload,
} from './events';
export { CONNECTIVITY_EVENTS } from './events';
```

**`app/domain/index.ts`**

This root grouping barrel re-exports the `devices` module's symbols individually (explicit named exports, per `domain/CLAUDE.md`) and must be updated too — it is not a pass-through of `domain/devices/index.ts`. Add `PairingCodeRequestedPayload` to the type list (alphabetically after `PairingCandidatePayload`, before `PairingConfirmError`) and `PairingRequestError` (alphabetically after `PairingModeError`, before `PairingSucceededPayload`); add `pairingRequestError` to the value list (alphabetically after `pairingModeError`):

```ts
export type {
  ConnectivityInitError,
  DeviceCreateError,
  DeviceDeleteError,
  DeviceMessageError,
  DeviceMessageEnvelope,
  DevicesLoadError,
  DeviceUpdateError,
  MessageReceivedPayload,
  PairingCandidateLostPayload,
  PairingCandidatePayload,
  PairingCodeRequestedPayload,
  PairingConfirmError,
  PairingFailedPayload,
  PairingModeError,
  PairingRequestError,
  PairingSucceededPayload,
  PeerConnectedPayload,
  PeerDisconnectedPayload,
} from './devices';
export {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  connectivityInitError,
  CONNECTIVITY_EVENTS,
  deviceCreateError,
  deviceDeleteError,
  deviceMessageEnvelopeSchema,
  deviceMessageError,
  devicesLoadError,
  deviceUpdateError,
  ENDPOINT_ID_HEX_REGEX,
  ENVELOPE_VERSION,
  pairingConfirmError,
  pairingModeError,
  pairingRequestError,
} from './devices';
```
