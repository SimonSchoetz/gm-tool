use std::collections::HashSet;
use std::future::poll_fn;
use std::pin::Pin;
use std::time::Duration;

use futures_core::Stream;
use iroh::endpoint::{
    Connection, IdleTimeout, QuicTransportConfig, SendStream, WriteError, presets,
};
use iroh::endpoint_info::EndpointInfo;
use iroh::{Endpoint, EndpointAddr, EndpointId, RelayMode};
use iroh_mdns_address_lookup::{DiscoveryEvent, MdnsAddressLookup};
use tauri::async_runtime::channel;
use tauri::{AppHandle, Emitter};

use super::identity::load_or_create_secret_key;
use super::{
    ALPN_MAIN, ALPN_PAIRING, ActiveConnection, ConnectionRole, ConnectivityState,
    EVENT_MESSAGE_RECEIVED, EVENT_PEER_CONNECTED, EVENT_PEER_DISCONNECTED, MessageReceivedPayload,
    PeerConnectedPayload, PeerDisconnectedPayload, TrustedPeer, pairing, parse_endpoint_id,
};

const CONNECTION_IDLE_TIMEOUT: Duration = Duration::from_secs(10);

pub async fn init(
    app: AppHandle,
    state: ConnectivityState,
    own_name: Option<String>,
    trusted_peers: Vec<TrustedPeer>,
) -> Result<String, String> {
    let trusted = trusted_peers
        .iter()
        .map(|peer| parse_endpoint_id(&peer.endpoint_id))
        .collect::<Result<HashSet<_>, _>>()?;

    let mut data = state.lock().await;
    if let Some(endpoint) = &data.endpoint {
        let existing_id = endpoint.id().to_string();
        data.own_name = own_name;
        data.trusted = trusted;
        return Ok(existing_id);
    }

    let secret_key = load_or_create_secret_key(&app)?;
    let own_id = secret_key.public();

    let mdns = MdnsAddressLookup::builder()
        .build(own_id)
        .map_err(|e| format!("Failed to start mDNS address lookup: {e}"))?;

    // iroh's default connection idle timeout is 30s, so a peer that dies without sending
    // CONNECTION_CLOSE (a crash, a kill, or the dev watcher rebuilding) would show as
    // connected for that long. The builder keeps iroh's 5s heartbeat, so a peer that has
    // really gone silent is detected within this window instead.
    let idle_timeout = IdleTimeout::try_from(CONNECTION_IDLE_TIMEOUT)
        .map_err(|e| format!("Invalid connection idle timeout: {e}"))?;
    let transport_config = QuicTransportConfig::builder()
        .max_idle_timeout(Some(idle_timeout))
        .build();

    // LAN-only invariant: relays disabled, no DNS/pkarr publishing, mDNS as the only lookup.
    let endpoint = Endpoint::builder(presets::Minimal)
        .secret_key(secret_key)
        .relay_mode(RelayMode::Disabled)
        .clear_address_lookup()
        .transport_config(transport_config)
        .alpns(vec![ALPN_MAIN.to_vec(), ALPN_PAIRING.to_vec()])
        .bind()
        .await
        .map_err(|e| format!("Failed to bind connectivity endpoint: {e}"))?;

    endpoint
        .address_lookup()
        .map_err(|e| format!("Failed to access address lookup services: {e}"))?
        .add(mdns.clone());

    data.endpoint = Some(endpoint.clone());
    data.own_name = own_name;
    data.trusted = trusted;
    drop(data);

    tauri::async_runtime::spawn(run_accept_loop(app.clone(), state.clone(), endpoint));
    tauri::async_runtime::spawn(run_discovery(app, state, mdns));

    Ok(own_id.to_string())
}

pub async fn send_envelope(
    state: &ConnectivityState,
    endpoint_id: &str,
    envelope: String,
) -> Result<(), String> {
    let remote = parse_endpoint_id(endpoint_id)?;
    let sender = state
        .lock()
        .await
        .connections
        .get(&remote)
        .map(|active| active.sender.clone())
        .ok_or_else(|| format!("No live connection to peer {endpoint_id}"))?;
    sender
        .send(envelope)
        .await
        .map_err(|_| format!("Connection to peer {endpoint_id} closed while sending"))
}

pub async fn remove_peer(state: &ConnectivityState, endpoint_id: &str) -> Result<(), String> {
    let remote = parse_endpoint_id(endpoint_id)?;
    let mut data = state.lock().await;
    data.trusted.remove(&remote);
    // Dropping the sender terminates the connection task, which closes the connection.
    data.connections.remove(&remote);
    Ok(())
}

pub async fn connected_peers(state: &ConnectivityState) -> Result<Vec<String>, String> {
    let data = state.lock().await;
    Ok(data.connections.keys().map(EndpointId::to_string).collect())
}

/// Closes the endpoint so peers are told immediately that this device is gone. Without this,
/// a peer keeps the connection in its live set until iroh's ~30s connection idle timeout
/// expires, leaving a stale "connected" indicator on the other device.
pub async fn shutdown(state: &ConnectivityState) {
    let endpoint = state.lock().await.endpoint.clone();
    if let Some(endpoint) = endpoint {
        endpoint.close().await;
    }
}

pub async fn set_own_name(state: &ConnectivityState, name: Option<String>) -> Result<(), String> {
    let mut data = state.lock().await;
    if data.endpoint.is_none() {
        return Err("Connectivity is not initialized".to_string());
    }
    data.own_name = name;
    Ok(())
}

async fn run_accept_loop(app: AppHandle, state: ConnectivityState, endpoint: Endpoint) {
    while let Some(incoming) = endpoint.accept().await {
        let app = app.clone();
        let state = state.clone();
        tauri::async_runtime::spawn(async move {
            let Ok(accepting) = incoming.accept() else {
                return;
            };
            let Ok(connection) = accepting.await else {
                return;
            };
            handle_incoming_connection(app, state, connection).await;
        });
    }
}

async fn handle_incoming_connection(
    app: AppHandle,
    state: ConnectivityState,
    connection: Connection,
) {
    let remote = connection.remote_id();
    if connection.alpn() == ALPN_MAIN {
        let is_trusted = state.lock().await.trusted.contains(&remote);
        if !is_trusted {
            connection.close(0u32.into(), b"untrusted");
            return;
        }
        run_main_connection(app, state, connection, ConnectionRole::Acceptor).await;
    } else if connection.alpn() == ALPN_PAIRING {
        let pairing_active = state.lock().await.pairing.is_some();
        if !pairing_active {
            connection.close(0u32.into(), b"pairing not active");
            return;
        }
        pairing::run_pairing_connection(app, state, connection, ConnectionRole::Acceptor).await;
    } else {
        connection.close(0u32.into(), b"unknown alpn");
    }
}

pub(crate) async fn run_main_connection(
    app: AppHandle,
    state: ConnectivityState,
    connection: Connection,
    role: ConnectionRole,
) {
    let remote = connection.remote_id();
    let (sender, mut receiver) = channel::<String>(32);

    // Both peers may dial, so both directions can establish at once. Deduplicate deterministically:
    // the "preferred" direction is the one dialed by the lexicographically smaller EndpointId, which
    // both peers compute identically. On a genuine conflict the preferred connection supersedes the
    // other; when only one direction establishes (e.g. the other is firewall-blocked) there is no
    // conflict and it is kept regardless of direction — that is what makes a one-directional block
    // survivable, mirroring how the pairing probe already dials both ways.
    let emit_connected = {
        let mut data = state.lock().await;
        data.dialing.remove(&remote);

        let own_id = data.endpoint.as_ref().map(|endpoint| endpoint.id());
        let this_is_preferred = match (role, own_id) {
            (ConnectionRole::Dialer, Some(own)) => own < remote,
            (ConnectionRole::Acceptor, Some(own)) => remote < own,
            // No endpoint means connectivity is shutting down — abandon this connection.
            (_, None) => false,
        };

        match data
            .connections
            .get(&remote)
            .map(|active| active.connection.clone())
        {
            Some(_) if !this_is_preferred => {
                drop(data);
                connection.close(0u32.into(), b"duplicate connection");
                return;
            }
            Some(existing) => {
                existing.close(0u32.into(), b"superseded by preferred direction");
                data.connections.insert(
                    remote,
                    ActiveConnection {
                        sender: sender.clone(),
                        connection: connection.clone(),
                    },
                );
                // The peer is already reported connected; replacing the underlying direction is invisible to the frontend.
                false
            }
            None => {
                data.connections.insert(
                    remote,
                    ActiveConnection {
                        sender: sender.clone(),
                        connection: connection.clone(),
                    },
                );
                true
            }
        }
    };

    if emit_connected {
        let _ = app.emit(
            EVENT_PEER_CONNECTED,
            PeerConnectedPayload {
                endpoint_id: remote.to_string(),
            },
        );
    }

    let streams = match role {
        ConnectionRole::Dialer => connection.open_bi().await,
        ConnectionRole::Acceptor => connection.accept_bi().await,
    };

    if let Ok((mut send_stream, mut recv_stream)) = streams {
        let mut frame_buffer: Vec<u8> = Vec::new();
        let mut chunk = [0u8; 4096];
        loop {
            tokio::select! {
                outgoing = receiver.recv() => {
                    match outgoing {
                        Some(frame) => {
                            if write_frame(&mut send_stream, &frame).await.is_err() {
                                break;
                            }
                        }
                        None => break,
                    }
                }
                incoming = recv_stream.read(&mut chunk) => {
                    match incoming {
                        Ok(Some(read_count)) => {
                            frame_buffer.extend_from_slice(&chunk[..read_count]);
                            for frame in drain_frames(&mut frame_buffer) {
                                let _ = app.emit(
                                    EVENT_MESSAGE_RECEIVED,
                                    MessageReceivedPayload {
                                        endpoint_id: remote.to_string(),
                                        envelope: frame,
                                    },
                                );
                            }
                        }
                        Ok(None) | Err(_) => break,
                    }
                }
            }
        }
    }

    connection.close(0u32.into(), b"closed");
    let mut data = state.lock().await;
    let is_current_connection = data
        .connections
        .get(&remote)
        .is_some_and(|current| current.sender.same_channel(&sender));
    if is_current_connection {
        data.connections.remove(&remote);
        drop(data);
        let _ = app.emit(
            EVENT_PEER_DISCONNECTED,
            PeerDisconnectedPayload {
                endpoint_id: remote.to_string(),
            },
        );
    }
}

pub(crate) async fn write_frame(
    send_stream: &mut SendStream,
    frame: &str,
) -> Result<(), WriteError> {
    send_stream.write_all(frame.as_bytes()).await?;
    send_stream.write_all(b"\n").await
}

pub(crate) fn drain_frames(frame_buffer: &mut Vec<u8>) -> Vec<String> {
    let mut frames = Vec::new();
    while let Some(newline_position) = frame_buffer.iter().position(|byte| *byte == b'\n') {
        let frame_bytes: Vec<u8> = frame_buffer.drain(..=newline_position).collect();
        let line = &frame_bytes[..frame_bytes.len() - 1];
        if let Ok(text) = std::str::from_utf8(line)
            && !text.is_empty()
        {
            frames.push(text.to_string());
        }
    }
    frames
}

/// Dials the peer over `gm-tool` when it is trusted and neither connected nor already being dialed.
/// Both peers may dial the same pair; `run_main_connection` deduplicates if both directions succeed.
/// mDNS re-delivers `Discovered` for a live peer repeatedly, so this is retried until a connection
/// exists — no separate reconnect timer is needed.
pub(crate) async fn maybe_dial_trusted_peer(
    app: &AppHandle,
    state: &ConnectivityState,
    addr: EndpointAddr,
) {
    let remote = addr.id;
    let mut data = state.lock().await;
    let Some(endpoint) = data.endpoint.clone() else {
        return;
    };
    let should_dial = data.trusted.contains(&remote)
        && !data.connections.contains_key(&remote)
        && !data.dialing.contains(&remote);
    if !should_dial {
        return;
    }
    data.dialing.insert(remote);
    drop(data);

    let app = app.clone();
    let state = state.clone();
    tauri::async_runtime::spawn(async move {
        match endpoint.connect(addr, ALPN_MAIN).await {
            Ok(connection) => {
                run_main_connection(app, state, connection, ConnectionRole::Dialer).await;
            }
            Err(_) => {
                state.lock().await.dialing.remove(&remote);
            }
        }
    });
}

async fn run_discovery(app: AppHandle, state: ConnectivityState, mdns: MdnsAddressLookup) {
    let mut events = mdns.subscribe().await;
    while let Some(event) = next_discovery_event(&mut events).await {
        match event {
            DiscoveryEvent::Discovered { endpoint_info, .. } => {
                handle_discovered(&app, &state, endpoint_info).await;
            }
            DiscoveryEvent::Expired { endpoint_id } => {
                state.lock().await.discovered.remove(&endpoint_id);
            }
            _ => {}
        }
    }
}

async fn next_discovery_event<S: Stream<Item = DiscoveryEvent> + Unpin>(
    events: &mut S,
) -> Option<DiscoveryEvent> {
    poll_fn(|context| Pin::new(&mut *events).poll_next(context)).await
}

async fn handle_discovered(
    app: &AppHandle,
    state: &ConnectivityState,
    endpoint_info: EndpointInfo,
) {
    let remote = endpoint_info.endpoint_id;
    let addr = endpoint_info.into_endpoint_addr();
    let is_trusted = {
        let mut data = state.lock().await;
        let Some(endpoint) = &data.endpoint else {
            return;
        };
        if endpoint.id() == remote {
            return;
        }
        data.discovered.insert(remote, addr.clone());
        data.trusted.contains(&remote)
    };

    if is_trusted {
        maybe_dial_trusted_peer(app, state, addr).await;
    } else {
        pairing::maybe_probe_candidate(app, state, addr).await;
    }
}
