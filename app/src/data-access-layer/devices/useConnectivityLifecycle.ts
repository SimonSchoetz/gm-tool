import { useCallback, useEffect, useRef } from 'react';
import { useErrorBoundary } from 'react-error-boundary';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import {
  CONNECTIVITY_EVENTS,
  type ConnectivityInitError,
  type MessageReceivedPayload,
  type PairingSucceededPayload,
  type PeerConnectedPayload,
  type PeerDisconnectedPayload,
} from '@domain';
import * as devicesService from '@services/devicesService';
import * as syncService from '@services/syncService';
import { deviceKeys } from './deviceKeys';
import type { PeerCompatMap } from './usePeerSyncCompat';

const SYNC_HELLO_TIMEOUT_MS = 5000;
const SYNC_POLL_INTERVAL_MS = 3000;

type UseConnectivityLifecycleReturn = {
  connectivityInitError: ConnectivityInitError | null;
};

export const useConnectivityLifecycle = (): UseConnectivityLifecycleReturn => {
  const queryClient = useQueryClient();
  const { showBoundary } = useErrorBoundary();
  const helloTimersRef = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  // throwOnError is intentionally omitted — connectivity init is non-blocking infrastructure.
  // A firewall-blocked or otherwise failed init must not crash the app into the Error
  // Boundary; the app degrades gracefully instead (grey status dots everywhere, pairing
  // attempts fail with the pairing dialog's inline error).
  const { error } = useQuery({
    queryKey: deviceKeys.init(),
    queryFn: async () => {
      await devicesService.initializeConnectivity();
      return true;
    },
    staleTime: Infinity,
    retry: false,
  });

  const startSyncHandshake = useCallback(
    (endpointId: string) => {
      const timers = helloTimersRef.current;
      void syncService.sendSyncHello(endpointId).catch(() => {
        // best-effort, mirrors sendHello
      });

      const existingTimer = timers.get(endpointId);
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        timers.delete(endpointId);
        queryClient.setQueryData<PeerCompatMap>(
          deviceKeys.syncCompat(),
          (old) => ({ ...(old ?? {}), [endpointId]: 'incompatible' }),
        );
      }, SYNC_HELLO_TIMEOUT_MS);
      timers.set(endpointId, timer);
    },
    [queryClient],
  );

  useEffect(() => {
    // A webview reload leaves the Rust-side connection alive, so peerConnected never fires again for peers that were already connected — without this bootstrap their handshake never runs, the compat cache stays empty, and they render as disconnected while the push poller skips them.
    void devicesService
      .getConnectedPeers()
      .then((peerIds) => {
        peerIds.forEach(startSyncHandshake);
      })
      .catch(() => {
        // Best-effort: a peer missed here still handshakes on its next connect event.
      });
  }, [startSyncHandshake]);

  useEffect(() => {
    const timers = helloTimersRef.current;

    const unlistenPromises = [
      listen<PeerConnectedPayload>(
        CONNECTIVITY_EVENTS.peerConnected,
        (event) => {
          const { endpointId } = event.payload;
          queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
            old === undefined || old.includes(endpointId)
              ? old
              : [...old, endpointId],
          );
          void devicesService.sendHello(endpointId).catch(() => {
            // best-effort: the peer may drop between connect and hello; it will
            // re-announce on its own next connect
          });
          startSyncHandshake(endpointId);
        },
      ),
      listen<PeerDisconnectedPayload>(
        CONNECTIVITY_EVENTS.peerDisconnected,
        (event) => {
          const { endpointId } = event.payload;
          queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
            old?.filter((id) => id !== endpointId),
          );

          const timer = timers.get(endpointId);
          if (timer !== undefined) {
            clearTimeout(timer);
            timers.delete(endpointId);
          }
          queryClient.setQueryData<PeerCompatMap>(
            deviceKeys.syncCompat(),
            (old) => {
              if (old === undefined) return old;
              const { [endpointId]: _removed, ...rest } = old;
              return rest;
            },
          );
          syncService.resetPeerSession(endpointId);
        },
      ),
      listen<MessageReceivedPayload>(
        CONNECTIVITY_EVENTS.messageReceived,
        (event) => {
          const { endpointId, envelope } = event.payload;
          void devicesService
            .handlePeerMessage(endpointId, envelope)
            .then((result) => {
              if (result === 'devices-changed') {
                void queryClient.invalidateQueries({
                  queryKey: deviceKeys.paired(),
                });
                void queryClient.invalidateQueries({
                  queryKey: deviceKeys.connected(),
                });
                return;
              }

              void syncService
                .handleSyncMessage(endpointId, envelope)
                .then((outcome) => {
                  if (outcome.kind === 'compat') {
                    const timer = timers.get(endpointId);
                    if (timer !== undefined) {
                      clearTimeout(timer);
                      timers.delete(endpointId);
                    }
                    queryClient.setQueryData<PeerCompatMap>(
                      deviceKeys.syncCompat(),
                      (old) => ({
                        ...(old ?? {}),
                        [endpointId]: outcome.compat,
                      }),
                    );
                  } else if (outcome.kind === 'applied') {
                    void queryClient.invalidateQueries({
                      predicate: (query) =>
                        typeof query.queryKey[0] === 'string' &&
                        !query.queryKey[0].startsWith('device'),
                    });
                  }
                })
                .catch((error: unknown) => {
                  // handleSyncMessage failure indicates a genuine processing error (malformed envelope, corrupt sync state), not an expected race — surface it.
                  showBoundary(error);
                });
            })
            .catch((error: unknown) => {
              // handlePeerMessage failure indicates a genuine processing error (malformed envelope), not an expected race — surface it.
              showBoundary(error);
            });
        },
      ),
      listen<PairingSucceededPayload>(
        CONNECTIVITY_EVENTS.pairingSucceeded,
        (event) => {
          void devicesService
            .completePairing(event.payload.endpointId, event.payload.name)
            .then(() => {
              void queryClient.invalidateQueries({
                queryKey: deviceKeys.paired(),
              });
            })
            .catch((error: unknown) => {
              // completePairing failure indicates a genuine persistence error, not an expected race — the duplicate pairing-succeeded event both sides emit is already absorbed by its own existing-row check.
              showBoundary(error);
            });
        },
      ),
    ];

    return () => {
      unlistenPromises.forEach((promise) => {
        void promise.then((unlisten) => {
          unlisten();
        });
      });
      timers.forEach((timer) => {
        clearTimeout(timer);
      });
      timers.clear();
    };
  }, [queryClient, startSyncHandshake, showBoundary]);

  useEffect(() => {
    // pushNewChanges derives its own targets from syncService's lastPushedSeq map — the poller must not filter on the device query cache, whose connected/compat entries are undefined whenever no device screen is mounted (which silently suppressed every live push during entity editing).
    const interval = setInterval(() => {
      void syncService.pushNewChanges().catch(() => {
        // A push racing a disconnect must not surface; the reconnect pull covers the gap.
      });
    }, SYNC_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return {
    connectivityInitError:
      error?.name === 'ConnectivityInitError'
        ? (error as ConnectivityInitError)
        : null,
  };
};
