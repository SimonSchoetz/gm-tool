import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  CONNECTIVITY_EVENTS,
  type PairingCandidateLostPayload,
  type PairingCandidatePayload,
  type PairingFailedPayload,
} from '@domain';
import {
  Button,
  GlassPanel,
  HorizontalDivider,
  Input,
  LoadingIcon,
} from '@/components';
import { usePairing } from '@/data-access-layer';
import { cn } from '@/util';
import type { FCProps } from '@/types';
import './PairDeviceDialog.css';

type Props = {
  onClose: () => void;
};

export const PairDeviceDialog: FCProps<Props> = ({ onClose }) => {
  const {
    pairingCode,
    submitCode,
    isSubmitting,
    submitError,
    clearSubmitError,
  } = usePairing();
  // Candidates are transient UI state — never cached, never persisted.
  const [candidates, setCandidates] = useState<PairingCandidatePayload[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [failureReason, setFailureReason] = useState<string | null>(null);

  useEffect(() => {
    const removeCandidate = (endpointId: string) => {
      setCandidates((current) =>
        current.filter((candidate) => candidate.endpointId !== endpointId),
      );
      setSelectedId((current) => (current === endpointId ? null : current));
    };

    const unlistenPromises = [
      listen<PairingCandidatePayload>(
        CONNECTIVITY_EVENTS.pairingCandidate,
        (event) => {
          setCandidates((current) =>
            current.some(
              (candidate) => candidate.endpointId === event.payload.endpointId,
            )
              ? current
              : [...current, event.payload],
          );
        },
      ),
      listen<PairingCandidateLostPayload>(
        CONNECTIVITY_EVENTS.pairingCandidateLost,
        (event) => {
          removeCandidate(event.payload.endpointId);
        },
      ),
      listen<PairingFailedPayload>(
        CONNECTIVITY_EVENTS.pairingFailed,
        (event) => {
          removeCandidate(event.payload.endpointId);
          setFailureReason(event.payload.reason);
        },
      ),
      // useConnectivityLifecycle owns this event's persistence (completePairing + list invalidation) — this handler only closes the dialog.
      listen(CONNECTIVITY_EVENTS.pairingSucceeded, () => {
        onClose();
      }),
    ];

    return () => {
      unlistenPromises.forEach((promise) => {
        void promise.then((unlisten) => {
          unlisten();
        });
      });
    };
  }, [onClose]);

  return (
    <GlassPanel className='pair-device-dialog'>
      <h1 className='pair-device-dialog-title'>Pair a new device</h1>

      <p className='pair-device-dialog-code-hint'>
        Enter this code on the other device:
      </p>
      {pairingCode !== null ? (
        <span className='pair-device-dialog-code'>{pairingCode}</span>
      ) : (
        <LoadingIcon />
      )}

      <HorizontalDivider />

      <p>Nearby devices in pairing mode:</p>
      {candidates.length === 0 ? (
        <div className='pair-device-dialog-searching'>
          <LoadingIcon />
          <span className='pair-device-dialog-searching-hint'>Searching…</span>
        </div>
      ) : (
        <ul className='pair-device-dialog-candidates'>
          {candidates.map((candidate) => (
            <li key={candidate.endpointId}>
              <button
                type='button'
                className={cn(
                  'pair-device-dialog-candidate',
                  candidate.endpointId === selectedId &&
                    'pair-device-dialog-candidate--selected',
                )}
                onClick={() => {
                  setSelectedId(candidate.endpointId);
                  setCodeInput('');
                  clearSubmitError();
                }}
              >
                {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a cleared name is an empty string and also falls back to the id prefix */}
                {candidate.name || candidate.endpointId.slice(0, 8)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedId !== null && (
        <div className='pair-device-dialog-confirm'>
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
              submitCode(selectedId, codeInput);
            }}
          />
        </div>
      )}
      {submitError !== null && (
        <p className='pair-device-dialog-error'>{submitError.message}</p>
      )}
      {failureReason !== null && (
        <p className='pair-device-dialog-error'>{failureReason}</p>
      )}
    </GlassPanel>
  );
};
