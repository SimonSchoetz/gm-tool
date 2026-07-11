import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import {
  CONNECTIVITY_EVENTS,
  type MessageReceivedPayload,
  type PairingSucceededPayload,
  type PeerConnectedPayload,
  type PeerDisconnectedPayload,
} from '@domain';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';

export const useConnectivityLifecycle = (): void => {
  const queryClient = useQueryClient();

  // throwOnError is intentionally omitted — connectivity init is non-blocking infrastructure.
  // A firewall-blocked or otherwise failed init must not crash the app into the Error
  // Boundary; the app degrades gracefully instead (grey status dots everywhere, pairing
  // attempts fail with the pairing dialog's inline error).
  useQuery({
    queryKey: deviceKeys.init(),
    queryFn: async () => {
      await devicesService.initializeConnectivity();
      return true;
    },
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    const unlistenPromises = [
      listen<PeerConnectedPayload>(
        CONNECTIVITY_EVENTS.peerConnected,
        (event) => {
          queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
            old === undefined || old.includes(event.payload.endpointId)
              ? old
              : [...old, event.payload.endpointId],
          );
          void devicesService.sendHello(event.payload.endpointId).catch(() => {
            // best-effort: the peer may drop between connect and hello; it will
            // re-announce on its own next connect
          });
        },
      ),
      listen<PeerDisconnectedPayload>(
        CONNECTIVITY_EVENTS.peerDisconnected,
        (event) => {
          queryClient.setQueryData<string[]>(deviceKeys.connected(), (old) =>
            old?.filter((id) => id !== event.payload.endpointId),
          );
        },
      ),
      listen<MessageReceivedPayload>(
        CONNECTIVITY_EVENTS.messageReceived,
        (event) => {
          void devicesService
            .handlePeerMessage(event.payload.endpointId, event.payload.envelope)
            .then((result) => {
              if (result === 'devices-changed') {
                void queryClient.invalidateQueries({
                  queryKey: deviceKeys.paired(),
                });
                void queryClient.invalidateQueries({
                  queryKey: deviceKeys.connected(),
                });
              }
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
    };
  }, [queryClient]);
};
