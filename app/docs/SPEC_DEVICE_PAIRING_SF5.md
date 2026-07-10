# SF5: Data Access Layer — Devices Hooks, Connectivity Lifecycle, Barrel Cleanup

Adds the `data-access-layer/devices/` module, wires the connectivity lifecycle into the app root, and fixes the pre-existing key-factory barrel violations in every DAL module touched alongside the grouping barrel.

## Files Affected

Modified:

- `app/src/data-access-layer/index.ts` — add `export { useOwnDevice, usePairedDevices, useConnectedPeers, useConnectivityLifecycle } from './devices';` AND cleanup: remove every `*Keys` re-export from this grouping barrel (`adventureKeys`, `imageKeys`, `npcKeys`, `foeKeys`, `itemKeys`, `locationKeys`, `factionKeys`, `pcKeys`, `sessionKeys`, `tableConfigKeys`, `sessionStepKeys`, `settingsKeys`, `updaterKeys`)
- `app/src/data-access-layer/adventures/index.ts` — cleanup: remove the `adventureKeys` export line
- `app/src/data-access-layer/images/index.ts` — cleanup: remove `imageKeys`
- `app/src/data-access-layer/npcs/index.ts` — cleanup: remove `npcKeys`
- `app/src/data-access-layer/foes/index.ts` — cleanup: remove `foeKeys`
- `app/src/data-access-layer/items/index.ts` — cleanup: remove `itemKeys`
- `app/src/data-access-layer/locations/index.ts` — cleanup: remove `locationKeys`
- `app/src/data-access-layer/factions/index.ts` — cleanup: remove `factionKeys`
- `app/src/data-access-layer/pcs/index.ts` — cleanup: remove `pcKeys`
- `app/src/data-access-layer/sessions/index.ts` — cleanup: remove `sessionKeys`
- `app/src/data-access-layer/table-config/index.ts` — cleanup: remove `tableConfigKeys`
- `app/src/data-access-layer/session-steps/index.ts` — cleanup: remove `sessionStepKeys`
- `app/src/data-access-layer/settings/index.ts` — cleanup: remove `settingsKeys`
- `app/src/data-access-layer/updater/index.ts` — cleanup: remove `updaterKeys`
- `app/src/App.tsx` — call `useConnectivityLifecycle()` at the top of `AppContent`

New:

- `app/src/data-access-layer/devices/deviceKeys.ts`
- `app/src/data-access-layer/devices/useOwnDevice.ts`
- `app/src/data-access-layer/devices/usePairedDevices.ts`
- `app/src/data-access-layer/devices/useConnectedPeers.ts`
- `app/src/data-access-layer/devices/useConnectivityLifecycle.ts`
- `app/src/data-access-layer/devices/index.ts`

## Barrel Cleanup Rationale

`app/src/CLAUDE.md` — Barrel Files: "Query key factories (`*Keys.ts` files) are internal to the DAL module and must not appear in the module barrel's public exports." Every existing module barrel violates this, and the grouping barrel re-exports them onward. Verified before speccing: no file outside `data-access-layer/` imports any `*Keys` factory, and every in-layer consumer already uses within-module relative imports — so the removals break nothing and require no consumer updates. This cleanup lands in this SF because it is the SF that first touches `data-access-layer/index.ts` (root CLAUDE.md — Fix violations in files you touch).

## `deviceKeys.ts`

```ts
export const deviceKeys = {
  own: () => ['device-own'] as const,
  paired: () => ['devices-paired'] as const,
  connected: () => ['devices-connected'] as const,
  init: () => ['devices-connectivity-init'] as const,
};
```

Internal to the module — not exported from `devices/index.ts`.

## `useOwnDevice.ts`

Return type:

```ts
type UseOwnDeviceReturn = {
  ownDevice: DeviceData | null;
  renameOwnDevice: (name: string) => void;
};
```

- Query: key `deviceKeys.own()`, queryFn `devicesService.getOwnDevice`, `throwOnError: true`.
- Rename follows the debounced-auto-save pattern from `useNpc.ts` (`data-access-layer/npcs/useNpc.ts` is the reference — timeout ref cleared on unmount, optimistic `queryClient.setQueryData`, 500 ms debounce, then `renameMutation.mutate(name)` with `mutationFn: (name: string) => devicesService.renameOwnDevice(name)` and `onSuccess` invalidating `deviceKeys.own()`). The pending-updates ref from the reference collapses to a single `string` value here — only one field exists. The optimistic update writes `{ ...old, name }` when `old` is non-null.
- `renameOwnDevice` accepts the raw input string; empty string is stored as-is (matching the entity-name auto-save behavior; the `_system` schema's `z.string().nullable()` accepts it).

## `usePairedDevices.ts`

Return type:

```ts
type UsePairedDevicesReturn = {
  pairedDevices: PairedDevice[];
  loading: boolean;
  forgetDevice: (endpointId: string) => Promise<void>;
};
```

Reference shape: `useAdventures.ts`. Query: key `deviceKeys.paired()`, queryFn `devicesService.getPairedDevices`, `throwOnError: true`, `data = []` default via destructuring. Forget mutation: `mutationFn: (endpointId: string) => devicesService.forgetDevice(endpointId)`, `onSuccess` invalidates `deviceKeys.paired()` and `deviceKeys.connected()`. Named wrapper `forgetDevice` awaits `mutateAsync` (the id is genuinely call-time data — the hook serves the whole list, so this does not violate the construction-time-closure rule, which applies to ids already known when the hook is constructed).

## `useConnectedPeers.ts`

Return type:

```ts
type UseConnectedPeersReturn = {
  connectedIds: string[];
};
```

Query: key `deviceKeys.connected()`, queryFn `devicesService.getConnectedPeers`, `throwOnError: true`, `staleTime: Infinity` — the cache is event-maintained by the lifecycle hook; refetching on the default stale timer would race the event stream. Default `[]`.

## `useConnectivityLifecycle.ts`

Called exactly once, from `AppContent` (below `TanstackQueryClientProvider`, which `App` renders above `AppContent` — provider position verified in `App.tsx`). Two responsibilities:

**1. Init (query, not effect):**

```ts
// throwOnError is intentionally omitted — connectivity init is non-blocking infrastructure.
// A firewall-blocked or otherwise failed init must not crash the app into the Error
// Boundary; the Devices section surfaces the failure locally via initError.
const { error } = useQuery({
  queryKey: deviceKeys.init(),
  queryFn: async () => {
    await devicesService.initializeConnectivity();
    return true;
  },
  staleTime: Infinity,
  retry: false,
});
```

The queryFn returns `true` because TanStack Query treats `undefined` as an error state — `void` queryFns are invalid. The `error` destructuring is not used — write a plain `useQuery(...)` statement, not the sketch's `const { error } =`. A failed init degrades gracefully with no dedicated error UI: every dot stays grey and pairing attempts fail with the dialog's inline error. Root spec KAD "Connectivity init and pairing-code submission handle errors locally" names this deviation; the block comment above is required at the call site.

**2. Event subscriptions (one `useEffect`, empty dependency array, `listen` from `@tauri-apps/api/event`):**

```ts
useEffect(() => {
  const unlistenPromises = [
    listen<PeerConnectedPayload>(CONNECTIVITY_EVENTS.peerConnected, (event) => {
      queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
        old === undefined || old.includes(event.payload.endpointId)
          ? old
          : [...old, event.payload.endpointId],
      );
      void devicesService.sendHello(event.payload.endpointId).catch(() => {
        // best-effort: the peer may drop between connect and hello; it will
        // re-announce on its own next connect
      });
    }),
    listen<PeerDisconnectedPayload>(CONNECTIVITY_EVENTS.peerDisconnected, (event) => {
      queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
        old?.filter((id) => id !== event.payload.endpointId),
      );
    }),
    listen<MessageReceivedPayload>(CONNECTIVITY_EVENTS.messageReceived, (event) => {
      void devicesService
        .handlePeerMessage(event.payload.endpointId, event.payload.envelope)
        .then((result) => {
          if (result === 'devices-changed') {
            void queryClient.invalidateQueries({ queryKey: deviceKeys.paired() });
            void queryClient.invalidateQueries({ queryKey: deviceKeys.connected() });
          }
        });
    }),
    listen<PairingSucceededPayload>(CONNECTIVITY_EVENTS.pairingSucceeded, (event) => {
      void devicesService
        .completePairing(event.payload.endpointId, event.payload.name)
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: deviceKeys.paired() });
        });
    }),
  ];

  return () => {
    unlistenPromises.forEach((p) => {
      void p.then((unlisten) => {
        unlisten();
      });
    });
  };
}, [queryClient]);
```

This sketch is binding for: which four events the lifecycle owns — `peer-connected`, `peer-disconnected`, `message-received`, and the persistence side of `pairing-succeeded` (SF7's dialog owns `pairing-candidate`, `pairing-candidate-lost`, and `pairing-failed`, and additionally subscribes to `pairing-succeeded` only to close itself — persistence stays here) — the functional `setQueryData` updates on primitives-only arrays, the hello send on peer-connect, the invalidation triggers, and promise-based unlisten cleanup (StrictMode double-mount safe). Unhandled rejections from `handlePeerMessage`/`completePairing` propagate as thrown domain errors — attach `.catch` only where the spec shows one.

`queryClient` comes from `useQueryClient()`. The hook returns `void`.

## `devices/index.ts`

```ts
export { useOwnDevice } from './useOwnDevice';
export { usePairedDevices } from './usePairedDevices';
export { useConnectedPeers } from './useConnectedPeers';
export { useConnectivityLifecycle } from './useConnectivityLifecycle';
```

Hooks only — `deviceKeys` stays internal (the rule the cleanup above enforces layer-wide).

## `App.tsx`

Add `useConnectivityLifecycle()` as the first statement of `AppContent` (currently an expression-bodied component — convert to a block body). `AppContent` is the hook's only call site, ever: mounting it twice would double-subscribe the event listeners. SF6 does not display init errors; the degraded-mode UX for a failed init is grey dots everywhere plus pairing attempts failing with the dialog's inline error.

## Cross-SF Wiring

`useOwnDevice`, `usePairedDevices`, `useConnectedPeers` are consumed by SF6's `DevicesSection`/`DeviceRow`; `devicesService.enterPairingMode`/`exitPairingMode`/`submitPairingCode` (SF4 exports with no SF5 consumer) are consumed by SF7's dialog.
