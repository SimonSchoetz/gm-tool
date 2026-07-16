## Sub-feature 3: Services

Adds the service-layer call that invokes the new Rust command. Consumed by Sub-feature 4 — named explicitly below.

### Files affected

Modified:

- `app/services/devicesService.ts`

### Services

Add `pairingRequestError` to the `@domain` import list, directly after `pairingConfirmError`:

```ts
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
  pairingRequestError,
  deviceMessageError,
} from '@domain';
```

Add `requestPairingCode` directly after `submitPairingCode`, before `completePairing`, wrapping the new Rust command exactly like the other `invoke()` calls in this file:

```ts
export const requestPairingCode = async (endpointId: string): Promise<void> => {
  try {
    await invoke('request_pairing_code', { endpointId });
  } catch (cause) {
    throw pairingRequestError(cause);
  }
};
```

Consumed by Sub-feature 4 — `usePairing.ts`'s `requestMutation.mutationFn` calls `devicesService.requestPairingCode`.
