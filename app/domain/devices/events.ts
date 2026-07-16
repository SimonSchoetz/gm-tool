export const CONNECTIVITY_EVENTS = {
  peerConnected: 'connectivity-peer-connected',
  peerDisconnected: 'connectivity-peer-disconnected',
  messageReceived: 'connectivity-message-received',
  pairingCandidate: 'connectivity-pairing-candidate',
  pairingCandidateLost: 'connectivity-pairing-candidate-lost',
  pairingCodeRequested: 'connectivity-pairing-code-requested',
  pairingSucceeded: 'connectivity-pairing-succeeded',
  pairingFailed: 'connectivity-pairing-failed',
} as const;

export type PeerConnectedPayload = { endpointId: string };
export type PeerDisconnectedPayload = { endpointId: string };
export type MessageReceivedPayload = { endpointId: string; envelope: string };
export type PairingCandidatePayload = {
  endpointId: string;
  name: string | null;
};
export type PairingCandidateLostPayload = { endpointId: string };
export type PairingCodeRequestedPayload = { endpointId: string };
export type PairingSucceededPayload = {
  endpointId: string;
  name: string | null;
};
export type PairingFailedPayload = { endpointId: string; reason: string };
