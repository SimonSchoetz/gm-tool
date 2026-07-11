import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { PairingConfirmError } from '@domain';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';

type UsePairingReturn = {
  pairingCode: string | null;
  submitCode: (endpointId: string, code: string) => void;
  isSubmitting: boolean;
  submitError: PairingConfirmError | null;
  clearSubmitError: () => void;
};

// Pairing mode is bound to the hook's lifetime: mounting enters it, unmounting exits it.
export const usePairing = (): UsePairingReturn => {
  const { data: pairingCode } = useQuery({
    queryKey: deviceKeys.pairing(),
    queryFn: devicesService.enterPairingMode,
    throwOnError: true,
    staleTime: Infinity,
    // A reopened dialog must get a fresh pairing session, not a cached code.
    gcTime: 0,
  });

  useEffect(() => {
    return () => {
      void devicesService.exitPairingMode().catch(() => {
        // Swallowed: failing to exit cleanly is recovered by Rust's idempotent
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

  const submitCode = (endpointId: string, code: string) => {
    submitMutation.mutate({ endpointId, code });
  };

  return {
    pairingCode: pairingCode ?? null,
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
