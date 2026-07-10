# SF7: PairDeviceDialog — Modal Pairing Flow

Adds the pairing entry point to `DevicesSection` and the modal dialog implementing the symmetric pairing UX: both devices open the same dialog, each shows its own 6-digit code and the live list of nearby candidates; typing the code shown on the other device completes pairing.

## Files Affected

Modified:

- `app/src/screens/settings/components/DevicesSection/DevicesSection.tsx` — add dialog open state, the "Pair new device" `Button`, and the portal-mounted dialog
- `app/src/screens/settings/components/DevicesSection/components/index.ts` — add `export { PairDeviceDialog } from './PairDeviceDialog/PairDeviceDialog';`
- `app/src/data-access-layer/devices/index.ts` — add `export { usePairing } from './usePairing';`
- `app/src/data-access-layer/devices/deviceKeys.ts` — add `pairing: () => ['devices-pairing'] as const`

New:

- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.tsx`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.css`
- `app/src/data-access-layer/devices/usePairing.ts`

## `usePairing.ts` (DAL)

The dialog's data hook — pairing mode lifecycle plus code submission. Return type:

```ts
type UsePairingReturn = {
  pairingCode: string | null;
  submitCode: (endpointId: string, code: string) => void;
  isSubmitting: boolean;
  submitError: PairingConfirmError | null;
  clearSubmitError: () => void;
};
```

- **Enter/exit is bound to hook lifetime:** the dialog mounts the hook only while open (the component itself is conditionally rendered), so a `useQuery` drives entry: key `deviceKeys.pairing()` (added to `deviceKeys.ts` in this SF), queryFn `devicesService.enterPairingMode`, `throwOnError: true`, `staleTime: Infinity`, `gcTime: 0` (a reopened dialog must get a fresh pairing session, not a cached code). `pairingCode` is `data ?? null`. Exit runs in a `useEffect` cleanup on unmount: `void devicesService.exitPairingMode()` — swallow rejection with an empty `.catch(() => {})`; failing to exit cleanly is recovered by Rust's idempotent session handling.
- **Submit mutation:**

```ts
const submitMutation = useMutation({
  mutationFn: ({ endpointId, code }: { endpointId: string; code: string }) =>
    devicesService.submitPairingCode(endpointId, code),
  /* throwOnError: false — deliberate exception to the global mutation default.
     A wrong code is an expected user input error rendered inline in the dialog
     (root spec KAD: "Connectivity init and pairing-code submission handle
     errors locally"); the Error Boundary is not its destination. */
  throwOnError: false,
});
```

`submitError` derives from `submitMutation.error` exactly like `useUpdater`'s `checkError`: `error?.name === 'PairingConfirmError' ? (error as PairingConfirmError) : null`. `clearSubmitError` wraps `submitMutation.reset`. `submitCode` wraps `submitMutation.mutate` with the domain signature. Success needs no handler here — the `pairing-succeeded` event drives persistence via SF5's lifecycle.

## `DevicesSection.tsx` Changes

- `const [pairDialogState, setPairDialogState] = useState<'open' | 'closed'>('closed');`
- Beneath the list/empty block: `<Button label='Pair new device' onClick={() => { setPairDialogState('open'); }} />`.
- Mount the dialog with the `DeleteDialogProvider` portal pattern (reference: `providers/DeleteDialogProvider/DeleteDialogProvider.tsx`): keep a second state `dialogMounted: boolean`; open sets both; `PopUpContainer`'s close (overlay click / Escape) sets `pairDialogState` to `'closed'`, and a 500 ms `setTimeout` effect then unmounts (`createPortal` into `document.body`):

```tsx
{dialogMounted &&
  createPortal(
    <PopUpContainer state={pairDialogState} setState={setPairDialogState}>
      <PairDeviceDialog onClose={() => { setPairDialogState('closed'); }} />
    </PopUpContainer>,
    document.body,
  )}
```

The unmount-after-close-animation effect mirrors the provider reference verbatim (timeout cleared on cleanup). Unmounting `PairDeviceDialog` is what exits pairing mode (hook cleanup) — the two-state dance ensures the close animation plays while the pairing session ends immediately only when the dialog fully unmounts; that half-second overlap is acceptable.

## `PairDeviceDialog.tsx`

**Purpose:** the pairing ceremony — show this device's code, list nearby devices in pairing mode, accept the other device's code.

Props (case 3):

```ts
type Props = {
  onClose: () => void;
};
```

**Behavior:**

- `usePairing()` for code + submission. `useQueryClient` is not needed.
- **Candidates are transient UI state** (never cached, never persisted): `const [candidates, setCandidates] = useState<PairingCandidatePayload[]>([]);` — populated by an event-subscription `useEffect` (empty deps) over `CONNECTIVITY_EVENTS.pairingCandidate` (append if id not present), `pairingCandidateLost` (filter out; also clear `selectedId` if it was the lost one), `pairingFailed` (treated as candidate-lost for the list, plus sets a local `failureReason` string shown inline). Setting state inside `listen` callbacks is a subscription callback — permitted under `react-hooks/set-state-in-effect`, which bans only top-level effect-body setState. Cleanup unlistens via the promise pattern from SF5's lifecycle sketch.
- **Success closes the dialog:** subscribe to `CONNECTIVITY_EVENTS.pairingSucceeded` in the same effect; on the event, call `onClose()`. (SF5's lifecycle persists the row and invalidates the list; this handler only closes.)
- `const [selectedId, setSelectedId] = useState<string | null>(null);` and `const [codeInput, setCodeInput] = useState('');` — clicking a candidate row sets `selectedId`, clears `codeInput`, and calls `clearSubmitError()`.
- Confirm: `<Button label='Confirm' onClick={() => { submitCode(selectedId, codeInput); }} />` rendered only when `selectedId !== null`; disable while `isSubmitting` (pass `disabled={isSubmitting}` — `Button` forwards `ActionContainer` props; read `ActionContainer.tsx` for the `disabled` prop before wiring, per the prop-forwarding verification rule).
- Inline error: when `submitError !== null`, render `<p className='pair-device-dialog-error'>{submitError.message}</p>` under the code input; likewise `failureReason` when set. Retry is just editing the input and confirming again (attempts are capped by Rust at 3, after which the candidate drops from the list via `pairing-failed`).

**State transitions** (required — multiple handlers read state that other handlers write):

| Handler | Triggering event | State read | State mutated | No-op conditions |
| --- | --- | --- | --- | --- |
| candidate discovered | `pairing-candidate` event | `candidates` | `candidates` (append) | candidate id already in list |
| candidate lost | `pairing-candidate-lost` or `pairing-failed` event | `candidates`, `selectedId` | `candidates` (remove); `selectedId` → `null` if it was the lost id; `pairing-failed` also sets `failureReason` | id not in list (remove is a no-op filter) |
| candidate row click | user click | `selectedId` | `selectedId` (set), `codeInput` → `''`, submit error cleared via `clearSubmitError()` | clicking the already-selected row (re-clearing is harmless and acceptable) |
| code input change | user typing | — | `codeInput` | — |
| confirm click | user click | `selectedId`, `codeInput`, `isSubmitting` | none directly (fires `submitCode`) | `selectedId === null` (button not rendered), `isSubmitting` (button disabled) |
| pairing succeeded | `pairing-succeeded` event | — | none — calls `onClose()` | — |

**UI / Visual:**

```tsx
<GlassPanel className='pair-device-dialog'>
  <h1 className='pair-device-dialog-title'>Pair a new device</h1>
  <p className='pair-device-dialog-code-hint'>Enter this code on the other device:</p>
  <span className='pair-device-dialog-code'>{pairingCode ?? ''}</span>
  {/* while pairingCode is null: <LoadingIcon /> in its place */}
  <HorizontalDivider />
  <p>Nearby devices in pairing mode:</p>
  {/* empty candidates: <LoadingIcon /> + 'Searching…' muted line
      list: one row per candidate — name || id.slice(0, 8), click to select,
      selected row gets a --selected modifier class
      selected: <Input value={codeInput} onChange={...} placeholder='6-digit code' />
                + Confirm Button + inline error line */}
</GlassPanel>
```

`GlassPanel`, `Button`, `Input`, `LoadingIcon`, `HorizontalDivider` from `@/components`. The code display is large type — size via existing typography tokens where possible; raw values follow the one-off protocol. The candidate name fallback repeats `|| id.slice(0, 8)` from `DeviceRow` deliberately: two different concerns (transient pairing candidate vs. persisted device row) — separation of concerns over DRY; do not extract a shared helper across them.

## Tests

No component tests (Testing Policy). No helpers extracted. `usePairing` is a DAL hook — the layer carries no hook unit tests (consistent with every existing DAL module).

## Cross-SF Wiring

Consumes SF4's `enterPairingMode`/`exitPairingMode`/`submitPairingCode`, SF3's `CONNECTIVITY_EVENTS` + pairing payload types + `PairingConfirmError`, and closes the loop on SF5's `pairing-succeeded` persistence. Nothing introduced here awaits a later consumer — this is the final SF.
