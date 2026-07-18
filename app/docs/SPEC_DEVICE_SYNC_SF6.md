# SF6: UI — StatusIndicator Variant Union, DeviceRow Status Derivation

The yellow state. `StatusIndicator`'s boolean prop becomes a three-state variant union (the variant-system rule: never boolean props once a component grows beyond one variant), rendered as a third globe icon, and `DeviceRow` derives the peer's status from the two runtime caches. Depends on SF5.

## Files Affected

All paths below are under `app/src/screens/settings/components/DevicesSection/components/PairedDevices/components/DeviceRow/`.

Modified:

- `DeviceRow.tsx`
- `components/StatusIndicator/StatusIndicator.tsx`
- `components/StatusIndicator/StatusIndicator.css`
- `../../PairedDevices.tsx` (cleanup only, see below)

New:

- `helper/derivePeerStatus.ts`
- `helper/index.ts`
- `helper/__tests__/derivePeerStatus.test.ts`

Modified-file violation scan (all four Modified files read in full this session): `PairedDevices.tsx` declares `type Props = object` with `FCProps<Props>` for a zero-prop component — banned by the zero-props exception (`app/src/CLAUDE.md` — Props pattern). Cleanup task in this SF: drop the `Props` type and the `FCProps` annotation (`export const PairedDevices = () => ...`), removing the now-unused `FCProps` import. `StatusIndicator`'s CSS classes (`status--connected` / `status--disconnected`) use the block name `status` for a component named `StatusIndicator` — the flat-BEM rule derives the block from the component name; the variant refactor below re-namespaces them to `status-indicator--*` as part of the same edit (CSS class naming, `app/src/CLAUDE.md` — Styles). `DeviceRow.tsx` is otherwise clean.

## `helper/derivePeerStatus.ts`

The status vocabulary and its derivation — a branching pure function, therefore a `helper/` file with a required test. `DeviceRow` currently has no `helper/`; this SF creates it (`helper/index.ts` exports `derivePeerStatus` and `PeerStatus`).

```ts
export type PeerStatus = 'connected' | 'incompatible' | 'disconnected';

export const derivePeerStatus = (
  isConnected: boolean,
  compat: 'compatible' | 'incompatible' | null,
): PeerStatus => {
  if (!isConnected) return 'disconnected';
  if (compat === 'compatible') return 'connected';
  if (compat === 'incompatible') return 'incompatible';
  return 'disconnected';
};
```

The last branch is the "handshake pending" state (connected, no compat entry yet) — rendered as disconnected deliberately: an indicator that flashes green before the handshake settles would claim syncability that is not yet established. `PeerStatus` lives here as the neutral file both `DeviceRow` and `StatusIndicator` import from (a sub-component must never import a type back from its parent's component file).

### `helper/__tests__/derivePeerStatus.test.ts`

One test per row of the truth table (literal expectations are correct here — no tunable constants):

1. not connected, any compat → `'disconnected'` (assert with `compat: 'compatible'` to prove disconnection dominates)
2. connected + `'compatible'` → `'connected'`
3. connected + `'incompatible'` → `'incompatible'`
4. connected + `null` (handshake pending) → `'disconnected'`

## `StatusIndicator.tsx`

Props become the variant union:

```ts
type Props = {
  status: PeerStatus;
};
```

`import type { PeerStatus } from '../../helper'` — traced from `StatusIndicator.tsx`'s location (`DeviceRow/components/StatusIndicator/` → up twice to `DeviceRow/`, then into `helper/`; importing through `helper/`'s barrel is correct — it is not a barrel `StatusIndicator` belongs to). The existing if/return branching extends to three cases, one icon per status, all imported directly under their pre-suffixed names (no `as` aliasing — `lucide-react` exports every icon pre-suffixed [I_1 in .claude/knowledge/lucide-react.md]; `GlobeLockIcon` verified present, there is no `GlobeAlertIcon` [S_7 in .claude/knowledge/lucide-react.md]):

- `'connected'` → `GlobeCheckIcon` with `className='status-indicator--connected'`
- `'incompatible'` → `GlobeLockIcon` with `className='status-indicator--incompatible'` — the locked globe reads as "connected but barred from syncing"
- `'disconnected'` → `GlobeOffIcon` with `className='status-indicator--disconnected'`

Each branch's class is a static string on a distinct element — plain `className`, no `cn()` (single static string rule). CSS: re-namespace the two existing rules to the new class names and add `.status-indicator--incompatible { color: var(--color-warning); }`, matching the property pattern of the existing two rules (read the current file's two rules and mirror their declarations; only the color differs).

## `DeviceRow.tsx`

- Add `usePeerSyncCompat()` (from `@/data-access-layer`) beside the existing hooks — `DeviceRow` already derives connectivity itself via `useConnectedPeers`; its props do not change.
- Replace the `connected` const (its only reader is the current `StatusIndicator` prop): `const status = derivePeerStatus(connectedIds.includes(device.id), compatById[device.id] ?? null);` — `compatById` is `PeerCompatMap = Partial<Record<...>>` (SF5), so the index access types as possibly-`undefined` and `?? null` is both necessary and lint-clean under `no-unnecessary-condition`.
- Pass `<StatusIndicator status={status} />`.
- Import `derivePeerStatus` from `./helper`.

## `PairedDevices.tsx`

Cleanup task only (violation named in the scan above): remove `type Props = object` and the `FCProps<Props>` annotation; the component becomes a plain zero-prop arrow function. No behavioral change — do not touch the loading/empty/list rendering.

## Cross-SF Wiring

Final SF — nothing awaits a later consumer. The acceptance criterion it closes: paired + connected + version-matched → `GlobeCheckIcon`; paired + connected + mismatched (or silent handshake) → `GlobeLockIcon` in the warning color; otherwise → `GlobeOffIcon`.
