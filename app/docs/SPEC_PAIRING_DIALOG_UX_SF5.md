## Sub-feature 5: Frontend

Redesigns `PairDeviceDialog` around the three-mode flow (`'list'` / `'entering-code'` / `'showing-code'`) and simplifies `PDDCandidatesList` now that there is no intermediate selection state.

### Files affected

Modified:

- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/PairDeviceDialog.tsx`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/components/PDDCandidatesList/PDDCandidatesList.tsx`
- `app/src/screens/settings/components/DevicesSection/components/PairDeviceDialog/components/PDDCandidatesList/PDDCandidatesList.css`

No change: `PairDeviceDialog.css` — every class name used by the redesigned JSX (`pair-device-dialog`, `pair-device-dialog-title`, `pair-device-dialog-code`, `pair-device-dialog-searching`, `pair-device-dialog-searching-hint`, `pair-device-dialog-confirm`, `pair-device-dialog-error`) already exists in the file unchanged; none become orphaned and none are new (verified by reading the current file in full).

### Frontend

**Purpose.** `PairDeviceDialog` is the pairing UI opened from `DevicesSection`. It now renders exactly one of three mutually exclusive views depending on where this pairing attempt stands: picking a nearby device, entering the code shown on the picked device, or displaying this device's own code because a peer picked it.

**Behavior.**

- `mode` is a derived `'list' | 'entering-code' | 'showing-code'` value computed on every render from `codeRequest` and `requestedCandidateId` — never stored state (root spec Key Architectural Decisions — "Own pairing code stays hidden until requested").
- Clicking a candidate in `'list'` mode calls `clearSubmitError()` then `requestCode(candidate.endpointId)` directly — no intermediate selection step (root spec Key Architectural Decisions — "No intermediate 'selected' candidate state").
- In `'entering-code'` mode, `codeInput` is dialog-local controlled-input text state (unchanged from today — no async source, correctly local per `app/src/CLAUDE.md`'s state-management rules). Confirm calls `submitCode(requestedCandidateId, codeInput)`.
- In `'showing-code'` mode, the own `pairingCode` renders (or a `LoadingIcon` while it is still being fetched) — no hook-side gating is needed since the hook fetches it unconditionally at mount, same as today.
- A `useEffect` watches `succeeded` and calls `onClose()` when it flips true (root spec Key Architectural Decisions — "Dialog owns close timing, the hook owns the data driving it").
- The existing terminal error rendering is preserved and extended: when `submitError`, `failureReason`, or the new `requestError` is set, the dialog renders only the title and the applicable error message(s), same early-return shape as today.

**UI / Visual.** Structure and CSS classes are unchanged from the current dialog — each mode reuses an existing block verbatim (the own-code block, the searching-or-candidates block, the confirm block), just gated by `mode` instead of always rendering side by side with a `HorizontalDivider` between them. Because the two sections `HorizontalDivider` used to separate no longer ever render together, `HorizontalDivider` is dropped from this component's imports and JSX.

Full replacement content for `PairDeviceDialog.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Button, GlassPanel, Input, LoadingIcon } from '@/components';
import { usePairing } from '@/data-access-layer';
import type { FCProps } from '@/types';
import './PairDeviceDialog.css';
import { PDDCandidatesList } from './components';

type Props = {
  onClose: () => void;
};

export const PairDeviceDialog: FCProps<Props> = ({ onClose }) => {
  const {
    pairingCode,
    candidates,
    failureReason,
    requestedCandidateId,
    codeRequest,
    requestCode,
    requestError,
    submitCode,
    isSubmitting,
    submitError,
    clearSubmitError,
    succeeded,
  } = usePairing();
  const [codeInput, setCodeInput] = useState('');

  // KAD: Dialog owns close timing, the hook owns the data driving it. Modal
  // open/close is a dialog-owned concern (app/src/CLAUDE.md — "Framework context
  // is not a prop"); succeeded is the hook's data driving that decision.
  useEffect(() => {
    if (succeeded) {
      onClose();
    }
  }, [succeeded, onClose]);

  // KAD: Own pairing code stays hidden until requested. mode is a plain derived
  // expression, never stored state.
  const mode: 'list' | 'entering-code' | 'showing-code' =
    codeRequest !== null
      ? 'showing-code'
      : requestedCandidateId !== null
        ? 'entering-code'
        : 'list';

  if (submitError || failureReason || requestError) {
    return (
      <GlassPanel className='pair-device-dialog'>
        <h1 className='pair-device-dialog-title'>Pair a new device</h1>
        {submitError !== null && (
          <p className='pair-device-dialog-error'>{submitError.message}</p>
        )}
        {failureReason !== null && (
          <p className='pair-device-dialog-error'>{failureReason}</p>
        )}
        {requestError !== null && (
          <p className='pair-device-dialog-error'>{requestError.message}</p>
        )}
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className='pair-device-dialog'>
      <h1 className='pair-device-dialog-title'>Pair a new device</h1>

      {mode === 'showing-code' && (
        <>
          <p>Enter this code on the other device:</p>
          {pairingCode !== null ? (
            <span className='pair-device-dialog-code'>{pairingCode}</span>
          ) : (
            <LoadingIcon />
          )}
        </>
      )}

      {mode === 'list' && (
        <>
          <p>Nearby devices in pairing mode:</p>
          {candidates.length === 0 ? (
            <div className='pair-device-dialog-searching'>
              <LoadingIcon />
              <span className='pair-device-dialog-searching-hint'>
                Searching…
              </span>
            </div>
          ) : (
            <PDDCandidatesList
              candidates={candidates}
              onClick={(id) => {
                clearSubmitError();
                requestCode(id);
              }}
            />
          )}
        </>
      )}

      {/* requestedCandidateId is re-checked here even though mode === 'entering-code'
          already implies it is non-null at runtime — mode and requestedCandidateId are
          independent variables, so tsc cannot narrow requestedCandidateId from the mode
          comparison alone. Do not remove this check. */}
      {mode === 'entering-code' && requestedCandidateId !== null && (
        <div className='pair-device-dialog-confirm'>
          <p>Enter the code on the other device:</p>
          <Input
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
            }}
            placeholder='6-digit code'
          />
          <Button
            label='Confirm'
            disabled={isSubmitting}
            onClick={() => {
              submitCode(requestedCandidateId, codeInput);
            }}
          />
        </div>
      )}
    </GlassPanel>
  );
};
```

**Purpose.** `PDDCandidatesList` renders the nearby-candidate list inside `'list'` mode. It no longer tracks or displays a "selected" candidate.

**Behavior.** `onClick` fires immediately per candidate click; there is no `selectedId` prop or disabled state to compute (root spec Key Architectural Decisions — "No intermediate 'selected' candidate state").

**UI / Visual.** Identical row layout and hover treatment as today; the `PDD-candidate--selected` modifier class is removed since nothing sets it anymore.

Full replacement content for `PDDCandidatesList.tsx`:

```tsx
import { FCProps } from '@/types';
import './PDDCandidatesList.css';
import { PairingCandidatePayload } from '@domain';
import { ActionContainer } from '@/components';
import { getShortenedDeviceId } from '../../../../helper';

type Props = {
  candidates: PairingCandidatePayload[];
  onClick: (candidateId: PairingCandidatePayload['endpointId']) => void;
};

export const PDDCandidatesList: FCProps<Props> = ({ candidates, onClick }) => {
  return (
    <ul className='PDD-candidates-list'>
      {candidates.map(({ endpointId, name }) => (
        <li key={endpointId}>
          <ActionContainer
            label='Pair device'
            className='PDD-candidate'
            onClick={() => {
              onClick(endpointId);
            }}
          >
            {(!!name && name) || getShortenedDeviceId(endpointId)}
          </ActionContainer>
        </li>
      ))}
    </ul>
  );
};
```

Full replacement content for `PDDCandidatesList.css`:

```css
.PDD-candidates-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  list-style-type: none;
}

.PDD-candidate {
  width: 100%;
  text-align: left;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  color: var(--color-fg);
  transition: var(--transition-hover-off);
  font-size: var(--font-size-xl);
}
.PDD-candidate:hover {
  color: var(--color-primary);
  transition: var(--transition-hover-on);
}
```
