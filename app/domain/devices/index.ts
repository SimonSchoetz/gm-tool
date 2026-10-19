export type {
  ConnectivityInitError,
  PairingConfirmError,
  PairingRequestError,
} from './errors';
export {
  connectivityInitError,
  deviceCreateError,
  deviceDeleteError,
  deviceMessageError,
  devicesLoadError,
  deviceUpdateError,
  pairingConfirmError,
  pairingModeError,
  pairingRequestError,
} from './errors';
export {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  deviceMessageEnvelopeSchema,
  ENVELOPE_VERSION,
} from './messages';
export { ENDPOINT_ID_HEX_REGEX } from './identity';
export type {
  MessageReceivedPayload,
  PairingCandidateLostPayload,
  PairingCandidatePayload,
  PairingCodeRequestedPayload,
  PairingFailedPayload,
  PairingSucceededPayload,
  PeerConnectedPayload,
  PeerDisconnectedPayload,
} from './events';
export { CONNECTIVITY_EVENTS } from './events';
