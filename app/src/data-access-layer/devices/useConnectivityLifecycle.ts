import { useCallback, useEffect, useRef } from 'react';
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
                  // handleSyncMessage failure indicates a genuine processing error
                  // (malformed envelope, corrupt sync state), not an expected race — surface it.
                  console.error('handleSyncMessage failed', error);
                });
            })
            .catch((error: unknown) => {
              // handlePeerMessage failure indicates a genuine processing error
              // (malformed envelope), not an expected race — surface it.
              console.error('handlePeerMessage failed', error);
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
  }, [queryClient, startSyncHandshake]);

  useEffect(() => {
    // Reading the query cache imperatively on each tick (not subscribing) is
    // deliberate: the poller needs the current value at fire time, not re-renders.
    const interval = setInterval(() => {
      const connected =
        queryClient.getQueryData<string[]>(deviceKeys.connected()) ?? [];
      const compat =
        queryClient.getQueryData<PeerCompatMap>(deviceKeys.syncCompat()) ?? {};
      const targets = connected.filter((id) => compat[id] === 'compatible');
      if (targets.length > 0) {
        void syncService.pushNewChanges(targets).catch(() => {
          // A push racing a disconnect must not surface; the reconnect pull covers the gap.
        });
      }
    }, SYNC_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [queryClient]);

  return {
    connectivityInitError:
      error?.name === 'ConnectivityInitError'
        ? (error as ConnectivityInitError)
        : null,
  };
};
