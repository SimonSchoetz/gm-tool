# SF5: Data Access Layer — Lifecycle Extension, Compat Cache, Poller

Extends the connectivity lifecycle with the sync handshake, message routing, compat state, and the live-push poller; adds the compat query hook. Depends on SF4.

## Files Affected

Modified:

- `app/src/data-access-layer/devices/deviceKeys.ts` — add `syncCompat: () => ['devices-sync-compat'] as const`
- `app/src/data-access-layer/devices/useConnectivityLifecycle.ts` — the extensions below
- `app/src/data-access-layer/devices/index.ts` — add `export { usePeerSyncCompat } from './usePeerSyncCompat';`

New:

- `app/src/data-access-layer/devices/usePeerSyncCompat.ts`

Modified-file violation scan: all three modified files were re-read this session and are clean against current conventions; no cleanup tasks.

## Compat State Model

`PeerCompatMap = Partial<Record<string, 'compatible' | 'incompatible'>>` — session-runtime state living in the query cache under `deviceKeys.syncCompat()`, event-maintained exactly like `deviceKeys.connected()`. `Partial` is load-bearing: with `noUncheckedIndexedAccess` absent from this tsconfig, a plain `Record`'s index access would type as always-defined, making SF6's `?? null` fallback an `no-unnecessary-condition` lint error — `Partial` restores the honest `| undefined`. A connected peer absent from the map is "handshake pending" (rendered grey by SF6). The map never persists.

## `usePeerSyncCompat.ts`

```ts
type UsePeerSyncCompatReturn = {
  compatById: PeerCompatMap;
};
```

`useQuery` with key `deviceKeys.syncCompat()`, `queryFn: () => Promise.resolve({})` (the cache is purely event-maintained; the queryFn only provides the empty initial state), `throwOnError: true`, `staleTime: Infinity` with the same justifying comment as `useConnectedPeers.ts`. Return `{ compatById: data ?? {} }`.

## `useConnectivityLifecycle.ts` Extensions

Import `* as syncService from '@services/syncService'`. `PeerCompatMap` is declared and exported in `usePeerSyncCompat.ts` (the file that owns the cache's read API); the lifecycle imports it via the direct relative sibling import `./usePeerSyncCompat`, the established within-module pattern.

**Handshake timers:** `const helloTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());` — 5-second timeout per connecting peer; on expiry, mark the peer incompatible in the compat cache (an older client never answers a `sync-hello` — root spec KAD "Compatibility key"). Timers are cleared on compat outcome, on disconnect, and all of them in the effect cleanup.

**`peerConnected` handler additions** (after the existing `sendHello` call):

- `void syncService.sendSyncHello(event.payload.endpointId).catch(() => { /* best-effort, mirrors sendHello */ });`
- start the 5 s timer: on fire, `setQueryData<PeerCompatMap>(deviceKeys.syncCompat(), (old) => ({ ...(old ?? {}), [endpointId]: 'incompatible' }))`.

**`peerDisconnected` handler additions:** clear the peer's timer; remove the peer's entry from the compat map (`setQueryData` with object rest destructuring); `syncService.resetPeerSession(event.payload.endpointId)`.

**`messageReceived` handler extension** — the routing contract (root spec KAD "Sync messages are a separate domain module"): when `devicesService.handlePeerMessage` resolves `'ignored'`, call `syncService.handleSyncMessage(endpointId, envelope)` and switch on `outcome.kind`:

- `'compat'`: clear the peer's timer; write `outcome.compat` into the compat map via `setQueryData`.
- `'applied'`: `void queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && !query.queryKey[0].startsWith('device') });` — coarse invalidation of all non-device queries (root spec KAD "Apply concurrency is serialized; invalidation is coarse"; per-table key factories are module-internal by convention and must not be imported here). Every current device key starts with `device` (`device-own`, `devices-paired`, `devices-connected`, `devices-connectivity-init`, `devices-pairing`, `devices-sync-compat`) — the predicate excludes exactly them.
- `'ignored'` / `'none'`: nothing.

**Live-push poller** — a second `useEffect` (empty deps beyond `queryClient`), `setInterval` every 3000 ms:

```ts
const connected = queryClient.getQueryData<string[]>(deviceKeys.connected()) ?? [];
const compat = queryClient.getQueryData<PeerCompatMap>(deviceKeys.syncCompat()) ?? {};
const targets = connected.filter((id) => compat[id] === 'compatible');
if (targets.length > 0) {
  void syncService.pushNewChanges(targets).catch(() => {
    // A push racing a disconnect must not surface; the reconnect pull covers the gap.
  });
}
```

Interval cleared in the effect cleanup (StrictMode-safe). Reading the query cache imperatively inside the interval callback (not subscribing) is deliberate: the poller needs the current value on each tick, not re-renders.

## State Transitions (required — multiple handlers read state that other handlers write)

State touched: `helloTimersRef` (timer map), the compat cache (`deviceKeys.syncCompat()`), the connected cache (`deviceKeys.connected()`).

| Handler | Triggering event | State read | State mutated | No-op conditions |
| --- | --- | --- | --- | --- |
| peer connected | `connectivity-peer-connected` | connected cache | connected cache (append); `helloTimersRef` (start 5 s timer for peer) | id already in connected cache (cache append only) |
| hello timer fires | timeout | — | compat cache (peer → `'incompatible'`); `helloTimersRef` (self-remove) | compat already set for peer (timer was not cleared in time — overwrite is harmless and identical) |
| compat outcome | `messageReceived` → `handleSyncMessage` returns `kind: 'compat'` | — | compat cache (peer → outcome); `helloTimersRef` (clear peer's timer) | no timer registered (already fired or cleared) |
| batch applied | `messageReceived` → `kind: 'applied'` | — | none directly — invalidates all non-`device` queries | — |
| peer disconnected | `connectivity-peer-disconnected` | — | connected cache (remove); compat cache (remove entry); `helloTimersRef` (clear); `syncService.resetPeerSession` | peer absent from either cache (removals are no-op filters) |
| poller tick | 3 s interval | connected cache + compat cache (imperative `getQueryData`) | none — calls `pushNewChanges` | no connected peer marked `'compatible'` |

## Tests

No new helpers or utils are introduced in this SF (the handlers are subscription callbacks inside the hook, which carries no unit tests per layer convention). No test files.

## Cross-SF Wiring

`usePeerSyncCompat` and the compat-map semantics ("absent = pending") are consumed by SF6's `DeviceRow`. Everything else wires into already-live consumers.
