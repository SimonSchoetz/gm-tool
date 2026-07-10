# SF6: DevicesSection — Settings UI

Adds the Devices section to the Settings screen: own-device name input, paired device list with status dots, forget action. The "Pair new device" button and its dialog land in SF7 together — do not add a disabled or no-op button here. This SF ends with a complete, shippable section that simply has no pairing entry point yet.

## Files Affected

Modified:

- `app/src/screens/settings/SettingsScreen.tsx` — render `<DevicesSection />` after `<ListConfigSection />`
- `app/src/screens/settings/components/index.ts` — add `export { DevicesSection } from './DevicesSection/DevicesSection';`

New:

- `app/src/screens/settings/components/DevicesSection/DevicesSection.tsx`
- `app/src/screens/settings/components/DevicesSection/DevicesSection.css`
- `app/src/screens/settings/components/DevicesSection/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/OwnDeviceCard/OwnDeviceCard.tsx`
- `app/src/screens/settings/components/DevicesSection/components/OwnDeviceCard/OwnDeviceCard.css`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/DeviceRow.tsx`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/DeviceRow.css`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/components/index.ts`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/components/StatusDot/StatusDot.tsx`
- `app/src/screens/settings/components/DevicesSection/components/DeviceRow/components/StatusDot/StatusDot.css`

Modified-file violation scan results: `SettingsScreen.tsx` (13 lines) and `settings/components/index.ts` are clean against current conventions — verified explicitly; no cleanup tasks.

## `DevicesSection.tsx`

**Purpose:** the management surface for device pairing — the user renames this device, sees all paired devices with live status, and forgets devices.

**Behavior:**

- Hooks: `useOwnDevice()`, `usePairedDevices()`, `useConnectedPeers()` — all from `@/data-access-layer`.
- Own-device card: render `<OwnDeviceCard />` only when `ownDevice !== null`; while `null` (query pending, or connectivity never initialized) render the same `GlassPanel` shell with a `LoadingIcon` in place of the input. This mount gate exists because the controlled-input auto-save pattern initializes its `useState` from the query value once, at mount — the entity-header precedent (`NpcHeader.tsx`) mounts against a warm cache, but the Settings screen's first visit has a cold `deviceKeys.own()` cache, so the input must not mount before data exists.
- Loading: while `usePairedDevices().loading`, render `<div className='content-center'>Loading...</div>` in place of the list (the `ListConfigSection` precedent).
- Empty: when `pairedDevices` is empty, render `<p className='devices-section-empty'>No paired devices yet.</p>` instead of the list.
- List: `<ul className='devices-section-list'>` of `DeviceRow` items, `key={device.id}`, passing `device` and `connected={connectedIds.includes(device.id)}`.

**UI / Visual:**

```tsx
<Section>
  <H2 heading='Devices' />
  {ownDevice !== null ? (
    <OwnDeviceCard />
  ) : (
    <GlassPanel intensity='bright' className='devices-section-own'>
      <LoadingIcon />
    </GlassPanel>
  )}
  <HorizontalDivider />
  {/* list | loading | empty */}
</Section>
```

`Section` and `H2` are imported via direct relative paths (`../Section/Section`, `../H2/H2`) — sibling files inside the `settings/components/` grouping folder must not import through their own barrel. `GlassPanel`, `LoadingIcon`, `HorizontalDivider` come from `@/components` (external consumer, one-level import). CSS: container spacing via existing spacing tokens; the empty line uses `color: var(--color-text-muted)`.

## `OwnDeviceCard.tsx`

**Purpose:** the editable name of this device — isolated so its controlled-input state mounts only when the own-device value is already in the query cache (see the mount gate above).

Zero external props — omit `FCProps` entirely per the zero-props exception. Calls `useOwnDevice()` itself (framework context is not a prop; the parent's gate guarantees a warm cache, so `ownDevice` is non-null here in practice — the code still handles `null` with `?? ''` because the type requires it).

**Behavior:** controlled-input auto-save rule (`app/src/CLAUDE.md` — State Management): `const [name, setName] = useState(ownDevice?.name ?? '');` and `onChange` calls both `setName(e.target.value)` and `renameOwnDevice(e.target.value)` (the debounce lives in the hook, SF5).

**UI / Visual:** mirrors `AppearanceSection`'s card composition:

```tsx
<GlassPanel intensity='bright' className='own-device-card'>
  <label className='own-device-card--content'>
    <span>This device's name</span>
    <Input value={name} onChange={...} placeholder='Unnamed device' />
  </label>
</GlassPanel>
```

## `DeviceRow.tsx`

**Purpose:** one paired device — identity at a glance plus the forget action.

Props (case 3 — closed API):

```ts
type Props = {
  device: PairedDevice;
  connected: boolean;
};
```

**Behavior:**

- Display name: `device.name || device.id.slice(0, 8)` — a device that never sent a name (or cleared it) shows its id prefix. `||` (not `??`) is deliberate: empty string also falls back.
- Forget: `ClickableIcon` with `variant='danger'` and a trash icon — `import { Trash2 as Trash2Icon } from 'lucide-react'` (icon alias rule, `app/src/CLAUDE.md`). Before writing the JSX, read `ClickableIcon.tsx` for the `icon`/`onClick` prop contract (verified: `icon: ReactNode` + `ActionContainer` props).
- Clicking forget opens the global delete dialog (`useDeleteDialog` from `@/providers` — provider verified above the settings route in `AppProviders`):

```tsx
openDeleteDialog({
  name: displayName,
  onDeletionConfirm: () => {
    void forgetDevice(device.id);
  },
  oneClickConfirm: true,
});
```

`oneClickConfirm: true` per the design decision — one confirmation click, no type-to-confirm. `forgetDevice` comes from `usePairedDevices()` called directly in `DeviceRow` (framework context is not a prop — the row owns its button's action; TanStack Query's cache deduplicates the second hook mount).

**UI / Visual:** `<li className='device-row'>` with `StatusDot`, the name (`span.device-row-name`, ellipsis overflow), and the forget icon right-aligned. Row uses flex with `gap: var(--spacing-sm)`; typography inherits.

## `StatusDot.tsx`

Lives in `DeviceRow/components/StatusDot/` — its immediate and only JSX parent is `DeviceRow` (sub-component ownership rule, `app/src/CLAUDE.md`). `DeviceRow/components/index.ts` exports it (`export { StatusDot } from './StatusDot/StatusDot';` — flat single-file sub-component, no own barrel needed); `DeviceRow` imports it from `./components`.

**Purpose:** the green/grey connection indicator (root spec scope: no yellow state exists).

Props (case 3):

```ts
type Props = {
  connected: boolean;
};
```

Render: `<span className={cn('status-dot', connected && 'status-dot--connected')} />` — `cn` justified by the conditional modifier. CSS: fixed-size circle (`border-radius: 50%`; size via an existing dimension/spacing token if one fits, else raw value reported per the one-off protocol), default `background: var(--color-text-muted)`, modifier `background: var(--color-success)`.

## `components/index.ts`

```ts
export { OwnDeviceCard } from './OwnDeviceCard/OwnDeviceCard';
export { DeviceRow } from './DeviceRow/DeviceRow';
```

`DevicesSection` imports both from `./components`. `StatusDot` is not exported here — it belongs to `DeviceRow` (see above).

## Tests

No component tests — React components must not have unit tests (`app/src/CLAUDE.md` — Testing Policy). No helpers are extracted (the `slice(0, 8)` fallback is a single expression, not helper-worthy), so no test files exist in this SF.

## Cross-SF Wiring

`DevicesSection`'s section layout reserves nothing for SF7 — SF7 adds the "Pair new device" `Button` beneath the list and the dialog it opens, modifying `DevicesSection.tsx`.
