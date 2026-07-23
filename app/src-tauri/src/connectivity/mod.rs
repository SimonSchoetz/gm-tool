mod connections;
mod identity;
mod pairing;

use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use iroh::endpoint::Connection;
use iroh::{Endpoint, EndpointAddr, EndpointId};
use serde::{Deserialize, Serialize};
use tauri::async_runtime::{Mutex, Sender};

pub use connections::{connected_peers, init, remove_peer, send_envelope, set_own_name, shutdown};
pub use pairing::{
    enter_pairing_mode, exit_pairing_mode, request_pairing_code, submit_pairing_code,
};

pub(crate) const ALPN_MAIN: &[u8] = b"gm-tool";
pub(crate) const ALPN_PAIRING: &[u8] = b"gm-tool-pairing";

pub(crate) const EVENT_PEER_CONNECTED: &str = "connectivity-peer-connected";
pub(crate) const EVENT_PEER_DISCONNECTED: &str = "connectivity-peer-disconnected";
pub(crate) const EVENT_MESSAGE_RECEIVED: &str = "connectivity-message-received";
pub(crate) const EVENT_PAIRING_CANDIDATE: &str = "connectivity-pairing-candidate";
pub(crate) const EVENT_PAIRING_CANDIDATE_LOST: &str = "connectivity-pairing-candidate-lost";
pub(crate) const EVENT_PAIRING_CODE_REQUESTED: &str = "connectivity-pairing-code-requested";
pub(crate) const EVENT_PAIRING_SUCCEEDED: &str = "connectivity-pairing-succeeded";
pub(crate) const EVENT_PAIRING_FAILED: &str = "connectivity-pairing-failed";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PeerConnectedPayload {
    pub(crate) endpoint_id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PeerDisconnectedPayload {
    pub(crate) endpoint_id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MessageReceivedPayload {
    pub(crate) endpoint_id: String,
    pub(crate) envelope: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingCandidatePayload {
    pub(crate) endpoint_id: String,
    pub(crate) name: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingCandidateLostPayload {
    pub(crate) endpoint_id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingCodeRequestedPayload {
    pub(crate) endpoint_id: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingSucceededPayload {
    pub(crate) endpoint_id: String,
    pub(crate) name: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingFailedPayload {
    pub(crate) endpoint_id: String,
    pub(crate) reason: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrustedPeer {
    pub endpoint_id: String,
    // Part of the IPC contract: TS sends `{ endpointId, name }` per peer. Rust never consumes peer names (they persist TS-side only), but the field documents the wire shape.
    #[allow(dead_code)]
    pub name: Option<String>,
}

#[derive(Clone, Copy)]
pub(crate) enum ConnectionRole {
    Dialer,
    Acceptor,
}

// A live main connection plus the outbound-frame sender feeding its send loop. The Connection handle is retained so a simultaneous-open conflict can close the losing direction in place (run_main_connection's dedup).
pub(crate) struct ActiveConnection {
    pub(crate) sender: Sender<String>,
    pub(crate) connection: Connection,
}

#[derive(Default)]
pub(crate) struct ConnectivityData {
    pub(crate) endpoint: Option<Endpoint>,
    pub(crate) own_name: Option<String>,
    pub(crate) trusted: HashSet<EndpointId>,
    pub(crate) connections: HashMap<EndpointId, ActiveConnection>,
    pub(crate) dialing: HashSet<EndpointId>,
    pub(crate) pairing: Option<pairing::PairingSession>,
    // Every discovered peer address is kept here so enter_pairing_mode can probe an already-known unpaired endpoint immediately instead of waiting for the next mDNS announcement.
    pub(crate) discovered: HashMap<EndpointId, EndpointAddr>,
}

pub type ConnectivityState = Arc<Mutex<ConnectivityData>>;

pub(crate) fn parse_endpoint_id(endpoint_id: &str) -> Result<EndpointId, String> {
    endpoint_id
        .parse::<EndpointId>()
        .map_err(|e| format!("Invalid endpoint id '{endpoint_id}': {e}"))
}
