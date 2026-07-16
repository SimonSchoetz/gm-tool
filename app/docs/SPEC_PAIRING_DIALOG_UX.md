# Pairing Dialog UX Redesign

Redesigns the pairing dialog flow so a user picks a specific nearby device to pair with, and the 6-digit code exchange happens only between that pair of dialogs — instead of every open pairing dialog showing both its own code and the full candidate list simultaneously. The trust model is unchanged: both devices must have a user open "Pair new device" for pairing to succeed.

Desired flow:

- Both devices are on the settings screen.
- On Device A: user clicks "Pair new device". The dialog opens showing only the list of nearby devices available to pair with — not Device A's own code.
- On Device A: user clicks the device they want to pair with.
- On Device A: the dialog switches to an input field for a 6-digit code.
- On Device B: its already-open dialog switches to showing just its own 6-digit code.
- On Device A: user enters the code; on success, both dialogs close.

## Progress tracker

- Sub-feature 1: Rust pairing protocol — `CodeRequest` frame, `request_pairing_code` command, event relay — [SPEC_PAIRING_DIALOG_UX_SF1.md](./SPEC_PAIRING_DIALOG_UX_SF1.md)
- Sub-feature 2: Domain vocabulary — `pairingCodeRequested` event, `PairingRequestError` — [SPEC_PAIRING_DIALOG_UX_SF2.md](./SPEC_PAIRING_DIALOG_UX_SF2.md)
- Sub-feature 3: Services — `devicesService.requestPairingCode` — [SPEC_PAIRING_DIALOG_UX_SF3.md](./SPEC_PAIRING_DIALOG_UX_SF3.md)
- Sub-feature 4: Data access layer — `usePairing` absorbs candidate/failure/succeeded/code-request state — [SPEC_PAIRING_DIALOG_UX_SF4.md](./SPEC_PAIRING_DIALOG_UX_SF4.md)
- Sub-feature 5: Frontend — `PairDeviceDialog` mode-based redesign, `PDDCandidatesList` simplification — [SPEC_PAIRING_DIALOG_UX_SF5.md](./SPEC_PAIRING_DIALOG_UX_SF5.md)

## Key Architectural Decisions

### Per-attempt initiator/responder role split

Role is decided per-attempt by whichever device sends `CodeRequest` first — either device can be the initiator or the responder across different attempts; nothing is fixed in the protocol or the data model. The **initiator** selects a candidate from its own candidate list, sends `CodeRequest`, and then enters the 6-digit code shown on the responder's screen. The **responder** receives `CodeRequest` and displays its own code, waiting for the initiator to submit it. Existing code verification (`CodeSubmit`/`CodeVerdict`) and `paired_devices` persistence are unaffected — this decision only changes how the two sides agree on who shows a code and who types one.

### Rust is a secure pipe — TypeScript owns the commitment guard

Rust relays every `CodeRequest` frame as a `connectivity-pairing-code-requested` event with no filtering; it has no concept of "already committed" and does not implement any ignore rule. The rule that prevents a device from becoming a responder while it has already committed to being the initiator for a different candidate — "ignore an incoming `CodeRequest` while `requestedCandidateId` is already set" — is enforced exclusively in `usePairing`'s event listener. This mirrors the existing split already established for code verification: Rust checks the code match and relays verdicts; it never makes UI-level commitment decisions.

### Own pairing code stays hidden until requested

The dialog's own 6-digit code is still fetched unconditionally at mount (unchanged from today), but it is rendered only in `'showing-code'` mode — after a `CodeRequest` event arrives for this session. This trades away the ability to read your own code before a peer selects you, in exchange for never showing two dialogs' worth of secrets and candidate lists at once. This is confirmed and intentional.

### The simultaneous-selection race is out of scope

If both users click a candidate at the same moment, the single guard described above is the entire mitigation — no timestamp comparison, tie-breaking, or renegotiation is implemented. This is a single user operating N of their own devices; they will not click on both simultaneously in normal use, so the residual race is accepted as-is.

### Candidate loss resets initiator commitment

When the candidate a user has requested a code from disappears from the candidate list — a `pairingCandidateLost` or `pairingFailed` event for that same `endpointId` — `requestedCandidateId` resets to `null`, returning the dialog to `'list'` mode. This mirrors the prior dialog's `removeCandidate` behavior, which cleared its local `selectedId` under the same condition; without this reset, a user could get stuck on the code-entry screen for a connection that no longer exists.

### No intermediate "selected" candidate state

Clicking a candidate calls `requestCode(candidate.endpointId)` directly. There is no local "this candidate is selected, awaiting confirmation" UI state, because the dialog transitions straight to `'entering-code'` mode the moment the request is issued — the candidate list itself unmounts on that same transition. `PDDCandidatesList` drops its `selectedId` prop and the `PDD-candidate--selected` modifier class as a direct consequence.

### Dialog owns close timing, the hook owns the data driving it

`usePairing` exposes `succeeded: boolean`, set from its own `pairingSucceeded` listener — this consolidates the dialog's previously separate, redundant subscription to the same event into one owner. `PairDeviceDialog` watches `succeeded` in a `useEffect` and calls `onClose()` itself. Modal open/close is correctly a dialog-owned concern per `app/src/CLAUDE.md`'s "Framework context is not a prop" section, but the *value* that drives the decision to close must come from the data access layer, not a `listen()` call living in the component.

## CLAUDE.md impact

None. This redesign is an internal reshaping of an already-documented command/event/hook pattern (`app/src-tauri/CLAUDE.md`'s "Adding New Commands" steps, the existing DAL `listen()` pattern) — it adds one more instance of each, not a new pattern. No file, path, or module referenced by any CLAUDE.md is added, renamed, or removed, and no previously documented example becomes invalid. The pending base-feature documentation debt (`connectivity/` in `app/src-tauri/CLAUDE.md`, `device.ts` in `app/db/CLAUDE.md`) is tracked separately and is out of scope for this spec.
