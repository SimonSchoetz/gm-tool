# SF6: UI — StatusDot Variant Union, DeviceRow Status Derivation

The yellow dot. `StatusDot`'s boolean prop becomes a three-state variant union (the variant-system rule: never boolean props once a component grows beyond one variant), and `DeviceRow` derives the peer's status from the two runtime caches. Depends on SF5.

## Files Affected

Modified:

- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/components/StatusDot/StatusDot.tsx`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/components/StatusDot/StatusDot.css`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/DeviceRow.tsx`

New:

- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/helper/derivePeerStatus.ts`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/helper/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/helper/__tests__/derivePeerStatus.test.ts`

Modified-file violation scan: `StatusDot.tsx` and `DeviceRow.tsx` were both read in full this session — clean against current conventions (the `prefer-nullish-coalescing` disable in `DeviceRow.tsx` carries its justifying comment and stays). No cleanup tasks.

## `helper/derivePeerStatus.ts`

The status vocabulary and its derivation — a branching pure function, therefore a `helper/` file with a required test:

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

The last branch is the "handshake pending" state (connected, no compat entry yet) — rendered grey deliberately: a dot that flashes green before the handshake settles would claim syncability that is not yet established. `PeerStatus` lives here as the neutral file both `DeviceRow` and `StatusDot` import from (a sub-component must never import a type back from its parent's component file). `helper/index.ts` exports both.

### `__tests__/derivePeerStatus.test.ts`

One test per row of the truth table (literal expectations are correct here — no tunable constants):

1. not connected, any compat → `'disconnected'` (assert with `compat: 'compatible'` to prove disconnection dominates)
2. connected + `'compatible'` → `'connected'`
3. connected + `'incompatible'` → `'incompatible'`
4. connected + `null` (handshake pending) → `'disconnected'`

## `StatusDot.tsx`

```ts
type Props = {
  status: PeerStatus;
};
```

`import type { PeerStatus } from '../../helper'` — resolve the relative path from `StatusDot.tsx`'s actual location (`DeviceRow/components/StatusDot/` → up twice to `DeviceRow/`, then `helper`; the helper barrel is not a barrel `StatusDot` belongs to, so importing through it is correct). Render:

```tsx
<span
  className={cn('status-dot', status !== 'disconnected' && `status-dot--${status}`)}
/>
```

CSS: `.status-dot` keeps `background: var(--color-text-muted)` as the base (grey); `.status-dot--connected` keeps `background: var(--color-success)`; add `.status-dot--incompatible { background: var(--color-warning); }`. Rename any existing `--connected` modifier only if its current class name differs — the implemented CSS must be read before editing; class names above are authoritative for the end state.

## `DeviceRow.tsx`

- Add `usePeerSyncCompat()` (from `@/data-access-layer`) beside the existing hooks. `DeviceRow` already derives `connected` itself from `useConnectedPeers` — its props do not change.
- Replace the `connected` const's sole use: `const status = derivePeerStatus(connectedIds.includes(device.id), compatById[device.id] ?? null);` — the `connected` const itself is removed (its only reader was the old `StatusDot` prop). `compatById` is `Partial<Record<...>>` (SF5), so the index access types as possibly-`undefined` and `?? null` is both necessary and lint-clean under `no-unnecessary-condition`.
- Pass `<StatusDot status={status} />`.
- Import `derivePeerStatus` from `./helper`.

## Cross-SF Wiring

Final SF — nothing awaits a later consumer. The acceptance criterion it closes: paired + connected + version-matched → green; paired + connected + mismatched (or silent) → yellow; otherwise grey.
