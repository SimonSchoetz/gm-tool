import { useEffect, useState } from 'react';
import { Button, GlassPanel, Input, LoadingIcon } from '@/components';
import { usePairing } from '@/data-access-layer';
import type { FCProps } from '@/types';
import './PairDeviceDialog.css';
import { PDDCandidatesList } from './components';
import { H2 } from '../../../H2/H2';

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

  // Closing is the dialog's own concern; usePairing only supplies the outcome that drives the decision.
  useEffect(() => {
    if (succeeded) {
      onClose();
    }
  }, [succeeded, onClose]);

  const mode: 'list' | 'entering-code' | 'showing-code' =
    codeRequest !== null
      ? 'showing-code'
      : requestedCandidateId !== null
        ? 'entering-code'
        : 'list';

  const DialogHeader = (
    <h1 className='pair-device-dialog-title'>Pair a new device</h1>
  );

  if (submitError || failureReason || requestError) {
    return (
      <GlassPanel className='pair-device-dialog'>
        {DialogHeader}
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
      {DialogHeader}

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
          <GlassPanel intensity='dim' className='pair-device-dialog--info-box'>
            <p>
              Open this dialog on your other device to start the pairing
              process. If it doesn't appear, check your network settings and
              make sure the GM Tool is allowed through your VPN.
            </p>
          </GlassPanel>
          <H2 heading='Nearby devices in pairing mode' />

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

      {/* requestedCandidateId is re-checked even though mode === 'entering-code' already implies it is non-null at runtime — mode is an independent variable, so tsc cannot narrow requestedCandidateId from the mode comparison alone. */}
      {mode === 'entering-code' && requestedCandidateId !== null && (
        <div className='pair-device-dialog-confirm'>
          <GlassPanel intensity='dim' className='pair-device-dialog--info-box'>
            <p>Look on your other device and enter the code shown there.</p>
          </GlassPanel>

          <Input
            className='pair-device-dialog--code-input'
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
            }}
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
