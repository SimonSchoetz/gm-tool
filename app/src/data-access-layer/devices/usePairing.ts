import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { PairingConfirmError } from '@domain';
import * as devicesService from '@services/devicesService';

type UsePairingReturn = {
  pairingCode: string | null;
  submitCode: (endpointId: string, code: string) => void;
  isSubmitting: boolean;
  submitError: PairingConfirmError | null;
  clearSubmitError: () => void;
};

export const usePairing = (): UsePairingReturn => {
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [enterError, setEnterError] = useState<Error | null>(null);

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

  const submitMutation = useMutation({
    mutationFn: ({ endpointId, code }: { endpointId: string; code: string }) =>
      devicesService.submitPairingCode(endpointId, code),
    /* throwOnError: false — deliberate exception to the global mutation default.
       A wrong code is an expected user input error rendered inline in the dialog
       (root spec KAD: "Connectivity init and pairing-code submission handle
       errors locally"); the Error Boundary is not its destination. */
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

  return {
    pairingCode,
    submitCode,
    isSubmitting: submitMutation.isPending,
    submitError:
      submitMutation.error?.name === 'PairingConfirmError'
        ? (submitMutation.error as PairingConfirmError)
        : null,
    clearSubmitError: () => {
      submitMutation.reset();
    },
  };
};
