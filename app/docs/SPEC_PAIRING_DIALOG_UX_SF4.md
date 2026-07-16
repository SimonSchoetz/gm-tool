## Sub-feature 4: Data access layer

`usePairing` absorbs the candidate list, failure reason, and pairing-succeeded listeners that currently live in `PairDeviceDialog`, and adds the new code-request state and the `requestCode` mutation. This is the sub-feature where the redesign's actual weight lands — `usePairing` is confirmed as the sole consumer-facing owner of pairing DAL state (its only consumer is `PairDeviceDialog.tsx`).

### Files affected

Modified:

- `app/src/data-access-layer/devices/usePairing.ts`

No change: `app/src/data-access-layer/devices/index.ts` and `app/src/data-access-layer/index.ts` both already re-export `usePairing` by name (verified by reading both barrels) — the hook's exported name and module path are unchanged, only its return shape grows, so neither barrel needs editing.

While rewriting this file, also fix the `submitMutation`'s inline comment: it currently cites `root spec KAD: "Connectivity init and pairing-code submission handle errors locally"`, a reference to a spec file that has already been deleted after implementation (specs are temporary per `app/docs/CLAUDE.md`). Replace it with the code-anchored rationale given in the full replacement content below — this mirrors the same fix already applied to a sibling comment in this file's history (commit `4974b14`, "replace spec-reference comment with code-anchored rationale").

### Data Access Layer

Full replacement content for `app/src/data-access-layer/devices/usePairing.ts`:

```ts
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import {
  CONNECTIVITY_EVENTS,
  type PairingCandidateLostPayload,
  type PairingCandidatePayload,
  type PairingCodeRequestedPayload,
  type PairingConfirmError,
  type PairingFailedPayload,
  type PairingRequestError,
} from '@domain';
import * as devicesService from '@services/devicesService';

type UsePairingReturn = {
  pairingCode: string | null;
  candidates: PairingCandidatePayload[];
  failureReason: string | null;
  requestedCandidateId: string | null;
  codeRequest: PairingCodeRequestedPayload | null;
  requestCode: (endpointId: string) => void;
  requestError: PairingRequestError | null;
  submitCode: (endpointId: string, code: string) => void;
  isSubmitting: boolean;
  submitError: PairingConfirmError | null;
  clearSubmitError: () => void;
  succeeded: boolean;
};

export const usePairing = (): UsePairingReturn => {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [enterError, setEnterError] = useState<Error | null>(null);
  const [candidates, setCandidates] = useState<PairingCandidatePayload[]>([]);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [requestedCandidateId, setRequestedCandidateId] = useState<
    string | null
  >(null);
  const [codeRequest, setCodeRequest] =
    useState<PairingCodeRequestedPayload | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  // Enter and exit are bound together in one effect on purpose. React StrictMode
  // double-mounts the dialog in dev (setup → cleanup → setup), which issues
  // enter/exit/enter as three direct, non-deduplicated calls; the Rust session is
  // ref-counted, so it ends up active. Driving enter through useQuery instead would
  // let React Query deduplicate the remount's re-enter, leaving one enter against the
  // cleanup's one exit — a torn-down session that rejects all incoming pairing
  // connections. A reopened dialog remounts, so it still gets a fresh session.
  useEffect(() => {
    let active = true;
    void devicesService.enterPairingMode().then(
      (code) => {
        if (active) setPairingCode(code);
      },
      (error: unknown) => {
        if (active) {
          setEnterError(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      },
    );
    return () => {
      active = false;
      void devicesService.exitPairingMode().catch(() => {
        // Swallowed: failing to exit cleanly is recovered by Rust's ref-counted
        // session handling on the next enter.
      });
    };
  }, []);

  useEffect(() => {
    const removeCandidate = (endpointId: string) => {
      setCandidates((current) =>
        current.filter((candidate) => candidate.endpointId !== endpointId),
      );
      // KAD: Candidate loss resets initiator commitment — mirrors the prior
      // dialog's selectedId-clearing behavior on candidate loss.
      setRequestedCandidateId((current) =>
        current === endpointId ? null : current,
      );
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
      listen(CONNECTIVITY_EVENTS.pairingSucceeded, () => {
        setSucceeded(true);
      }),
    ];

    return () => {
      unlistenPromises.forEach((promise) => {
        void promise.then((unlisten) => {
          unlisten();
        });
      });
    };
  }, []);

  // Separate effect, re-subscribed whenever requestedCandidateId changes, so the
  // guard below always reads the current value instead of a stale closure.
  // KAD: Rust is a secure pipe — this single guard is the entire implementation
  // of the "ignore an incoming request while already committed as initiator" rule.
  useEffect(() => {
    const unlistenPromise = listen<PairingCodeRequestedPayload>(
      CONNECTIVITY_EVENTS.pairingCodeRequested,
      (event) => {
        if (requestedCandidateId !== null) return;
        setCodeRequest(event.payload);
      },
    );

    return () => {
      void unlistenPromise.then((unlisten) => {
        unlisten();
      });
    };
  }, [requestedCandidateId]);

  const submitMutation = useMutation({
    mutationFn: ({ endpointId, code }: { endpointId: string; code: string }) =>
      devicesService.submitPairingCode(endpointId, code),
    /* throwOnError: false — deliberate exception to the global mutation default.
       A wrong code is expected user input error state, rendered inline in this
       dialog rather than routed to the Error Boundary. */
    throwOnError: false,
  });

  const requestMutation = useMutation({
    mutationFn: (endpointId: string) =>
      devicesService.requestPairingCode(endpointId),
    // Sets requestedCandidateId synchronously, before request_pairing_code's
    // invoke() resolves — this is the hook's own record of "I have committed to
    // being the initiator for this candidate."
    onMutate: (endpointId: string) => {
      setRequestedCandidateId(endpointId);
    },
    // throwOnError: false — same rationale as submitMutation: a failed request
    // (e.g. the candidate disconnected between click and invoke) is expected
    // user-facing state, not an Error Boundary case.
    throwOnError: false,
  });

  // Route enter failures to the Error Boundary, matching the enter query's former
  // throwOnError: true. Thrown after every hook call so the rules of hooks hold.
  if (enterError !== null) {
    throw enterError;
  }

  const submitCode = (endpointId: string, code: string) => {
    submitMutation.mutate({ endpointId, code });
  };

  const requestCode = (endpointId: string) => {
    requestMutation.mutate(endpointId);
  };

  return {
    pairingCode,
    candidates,
    failureReason,
    requestedCandidateId,
    codeRequest,
    requestCode,
    requestError:
      requestMutation.error?.name === 'PairingRequestError'
        ? (requestMutation.error as PairingRequestError)
        : null,
    submitCode,
    isSubmitting: submitMutation.isPending,
    submitError:
      submitMutation.error?.name === 'PairingConfirmError'
        ? (submitMutation.error as PairingConfirmError)
        : null,
    clearSubmitError: () => {
      submitMutation.reset();
    },
    succeeded,
  };
};
```
