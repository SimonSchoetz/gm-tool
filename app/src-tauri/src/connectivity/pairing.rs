use std::collections::{HashMap, HashSet};
use std::time::Duration;

use iroh::endpoint::Connection;
use iroh::{EndpointAddr, EndpointId};
use serde::{Deserialize, Serialize};
use tauri::async_runtime::{Sender, channel};
use tauri::{AppHandle, Emitter};

use super::connections::{drain_frames, maybe_dial_trusted_peer, write_frame};
use super::{
    ALPN_PAIRING, ConnectionRole, ConnectivityState, EVENT_PAIRING_CANDIDATE,
    EVENT_PAIRING_CANDIDATE_LOST, EVENT_PAIRING_FAILED, EVENT_PAIRING_SUCCEEDED,
    PairingCandidateLostPayload, PairingCandidatePayload, PairingFailedPayload,
    PairingSucceededPayload, parse_endpoint_id,
};

const MAX_CODE_FAILURES: u8 = 3;
const VERDICT_TIMEOUT: Duration = Duration::from_secs(10);

pub(crate) struct PairingSession {
    pub(crate) code: String,
    pub(crate) candidates: HashMap<EndpointId, PairingCandidate>,
    pub(crate) probing: HashSet<EndpointId>,
    // Number of live enter_pairing_mode calls not yet matched by an exit. React StrictMode double-mounts the dialog in dev (enter, exit, enter in arbitrary async order), so the session is torn down only when the last holder exits — a stale exit cannot wipe a session another mount still holds.
    pub(crate) ref_count: u32,
}

pub(crate) struct PairingCandidate {
    pub(crate) frame_sender: Sender<PairingFrame>,
    pub(crate) pending_verdict: Option<Sender<bool>>,
    pub(crate) failures: u8,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub(crate) enum PairingFrame {
    #[serde(rename_all = "camelCase")]
    PairingHello {
        endpoint_id: String,
        name: Option<String>,
    },
    #[serde(rename_all = "camelCase")]
    CodeSubmit { code: String },
    #[serde(rename_all = "camelCase")]
    CodeVerdict { accepted: bool },
}

pub async fn enter_pairing_mode(
    app: &AppHandle,
    state: &ConnectivityState,
) -> Result<String, String> {
    let (code, known_unpaired) = {
        let mut data = state.lock().await;
        if data.endpoint.is_none() {
            return Err("Connectivity is not initialized".to_string());
        }
        if let Some(session) = &mut data.pairing {
            session.ref_count += 1;
            eprintln!(
                "[connectivity] enter_pairing_mode: existing session, ref_count now {}",
                session.ref_count
            );
            return Ok(session.code.clone());
        }
        let code = format!("{:06}", rand::random_range(0..=999_999u32));
        eprintln!("[connectivity] enter_pairing_mode: new session, ref_count now 1");
        data.pairing = Some(PairingSession {
            code: code.clone(),
            candidates: HashMap::new(),
            probing: HashSet::new(),
            ref_count: 1,
        });
        let known_unpaired: Vec<EndpointAddr> = data
            .discovered
            .iter()
            .filter(|(id, _)| !data.trusted.contains(*id))
            .map(|(_, addr)| addr.clone())
            .collect();
        (code, known_unpaired)
    };

    // mDNS emits Discovered only once per peer, so endpoints found before this session started produce no further events — probe every already-known unpaired endpoint now.
    eprintln!(
        "[connectivity] pairing mode entered, probing {} known unpaired endpoint(s)",
        known_unpaired.len()
    );
    for addr in known_unpaired {
        maybe_probe_candidate(app, state, addr).await;
    }

    Ok(code)
}

pub async fn exit_pairing_mode(state: &ConnectivityState) -> Result<(), String> {
    let mut data = state.lock().await;
    if let Some(session) = &mut data.pairing {
        session.ref_count = session.ref_count.saturating_sub(1);
        let remaining = session.ref_count;
        if remaining == 0 {
            // Dropping the session drops every candidate's frame sender, which terminates
            // the candidate tasks and closes their connections.
            data.pairing = None;
        }
        eprintln!(
            "[connectivity] exit_pairing_mode: ref_count now {remaining} (session cleared: {})",
            remaining == 0
        );
    } else {
        eprintln!("[connectivity] exit_pairing_mode: no active session");
    }
    Ok(())
}

pub async fn submit_pairing_code(
    state: &ConnectivityState,
    endpoint_id: &str,
    code: String,
) -> Result<(), String> {
    let remote = parse_endpoint_id(endpoint_id)?;
    let (frame_sender, mut verdict_receiver) = {
        let mut data = state.lock().await;
        let session = data
            .pairing
            .as_mut()
            .ok_or_else(|| "No active pairing session".to_string())?;
        let candidate = session
            .candidates
            .get_mut(&remote)
            .ok_or_else(|| format!("Unknown pairing candidate {endpoint_id}"))?;
        let (verdict_sender, verdict_receiver) = channel::<bool>(1);
        candidate.pending_verdict = Some(verdict_sender);
        (candidate.frame_sender.clone(), verdict_receiver)
    };

    frame_sender
        .send(PairingFrame::CodeSubmit { code })
        .await
        .map_err(|_| "The pairing connection to this device closed".to_string())?;

    match tokio::time::timeout(VERDICT_TIMEOUT, verdict_receiver.recv()).await {
        Ok(Some(true)) => Ok(()),
        Ok(Some(false)) => Err("The other device rejected the code".to_string()),
        Ok(None) => Err("The pairing connection closed before a verdict arrived".to_string()),
        Err(_) => Err("Timed out waiting for the other device's verdict".to_string()),
    }
}

/// Dials a discovered, untrusted endpoint over the pairing ALPN while a session is active.
pub(crate) async fn maybe_probe_candidate(
    app: &AppHandle,
    state: &ConnectivityState,
    addr: EndpointAddr,
) {
    let remote = addr.id;
    let mut data = state.lock().await;
    let Some(endpoint) = data.endpoint.clone() else {
        return;
    };
    let Some(session) = data.pairing.as_mut() else {
        return;
    };
    if session.probing.contains(&remote) || session.candidates.contains_key(&remote) {
        return;
    }
    session.probing.insert(remote);
    drop(data);

    let app = app.clone();
    let state = state.clone();
    tauri::async_runtime::spawn(async move {
        eprintln!("[connectivity] probing pairing candidate {remote}");
        match endpoint.connect(addr, ALPN_PAIRING).await {
            Ok(connection) => {
                eprintln!("[connectivity] pairing connection to {remote} established");
                run_pairing_connection(app, state, connection, ConnectionRole::Dialer).await;
            }
            Err(error) => {
                eprintln!("[connectivity] pairing connect to {remote} FAILED: {error}");
                let mut data = state.lock().await;
                if let Some(session) = data.pairing.as_mut() {
                    session.probing.remove(&remote);
                }
            }
        }
    });
}

pub(crate) async fn run_pairing_connection(
    app: AppHandle,
    state: ConnectivityState,
    connection: Connection,
    role: ConnectionRole,
) {
    let remote = connection.remote_id();

    let streams = match role {
        ConnectionRole::Dialer => connection.open_bi().await,
        ConnectionRole::Acceptor => connection.accept_bi().await,
    };
    let (mut send_stream, mut recv_stream) = match streams {
        Ok(streams) => streams,
        Err(error) => {
            eprintln!("[connectivity] pairing stream setup with {remote} FAILED: {error}");
            remove_probe(&state, &remote).await;
            return;
        }
    };

    let own_hello = {
        let data = state.lock().await;
        let Some(endpoint) = &data.endpoint else {
            remove_probe(&state, &remote).await;
            return;
        };
        PairingFrame::PairingHello {
            endpoint_id: endpoint.id().to_string(),
            name: data.own_name.clone(),
        }
    };
    let Ok(hello_json) = serde_json::to_string(&own_hello) else {
        remove_probe(&state, &remote).await;
        return;
    };
    if write_frame(&mut send_stream, &hello_json).await.is_err() {
        eprintln!("[connectivity] failed to send pairing hello to {remote}");
        remove_probe(&state, &remote).await;
        return;
    }
    eprintln!("[connectivity] sent pairing hello to {remote}, awaiting peer hello");

    let (frame_sender, mut frame_receiver) = channel::<PairingFrame>(8);
    // Moved into the candidate entry on the peer's hello; the map is then the only owner,
    // so dropping the session (or replacing the entry) terminates this task.
    let mut sender_to_register = Some(frame_sender.clone());
    let mut candidate_name: Option<String> = None;
    let mut succeeded = false;
    let mut sent_accept_verdict = false;
    let mut frame_buffer: Vec<u8> = Vec::new();
    let mut chunk = [0u8; 4096];

    'connection: loop {
        tokio::select! {
            outgoing = frame_receiver.recv() => {
                match outgoing {
                    Some(frame) => {
                        let Ok(frame_json) = serde_json::to_string(&frame) else {
                            break 'connection;
                        };
                        if write_frame(&mut send_stream, &frame_json).await.is_err() {
                            break 'connection;
                        }
                    }
                    None => break 'connection,
                }
            }
            incoming = recv_stream.read(&mut chunk) => {
                let Ok(Some(read_count)) = incoming else {
                    break 'connection;
                };
                frame_buffer.extend_from_slice(&chunk[..read_count]);
                for raw_frame in drain_frames(&mut frame_buffer) {
                    let Ok(frame) = serde_json::from_str::<PairingFrame>(&raw_frame) else {
                        continue;
                    };
                    match frame {
                        PairingFrame::PairingHello { name, .. } => {
                            let Some(sender) = sender_to_register.take() else {
                                continue;
                            };
                            let mut data = state.lock().await;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            candidate_name = name.clone();
                            session.candidates.insert(remote, PairingCandidate {
                                frame_sender: sender,
                                pending_verdict: None,
                                failures: 0,
                            });
                            drop(data);
                            eprintln!("[connectivity] received peer hello from {remote}, emitting candidate");
                            let _ = app.emit(EVENT_PAIRING_CANDIDATE, PairingCandidatePayload {
                                endpoint_id: remote.to_string(),
                                name,
                            });
                        }
                        PairingFrame::CodeSubmit { code } => {
                            let mut data = state.lock().await;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            if code == session.code {
                                session.candidates.remove(&remote);
                                session.probing.remove(&remote);
                                data.trusted.insert(remote);
                                drop(data);
                                send_verdict(&mut send_stream, true).await;
                                sent_accept_verdict = true;
                                let _ = app.emit(EVENT_PAIRING_SUCCEEDED, PairingSucceededPayload {
                                    endpoint_id: remote.to_string(),
                                    name: candidate_name.clone(),
                                });
                                succeeded = true;
                                break 'connection;
                            }
                            let failures = match session.candidates.get_mut(&remote) {
                                Some(candidate) => {
                                    candidate.failures += 1;
                                    candidate.failures
                                }
                                None => MAX_CODE_FAILURES,
                            };
                            if failures >= MAX_CODE_FAILURES {
                                session.candidates.remove(&remote);
                                session.probing.remove(&remote);
                                drop(data);
                                send_verdict(&mut send_stream, false).await;
                                let _ = app.emit(EVENT_PAIRING_FAILED, PairingFailedPayload {
                                    endpoint_id: remote.to_string(),
                                    reason: "attempt limit reached".to_string(),
                                });
                                break 'connection;
                            }
                            drop(data);
                            send_verdict(&mut send_stream, false).await;
                        }
                        PairingFrame::CodeVerdict { accepted } => {
                            let mut data = state.lock().await;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            let Some(candidate) = session.candidates.get_mut(&remote) else {
                                continue;
                            };
                            let verdict_sender = candidate.pending_verdict.take();
                            if accepted {
                                session.candidates.remove(&remote);
                                session.probing.remove(&remote);
                                data.trusted.insert(remote);
                                drop(data);
                                if let Some(sender) = verdict_sender {
                                    let _ = sender.try_send(true);
                                }
                                let _ = app.emit(EVENT_PAIRING_SUCCEEDED, PairingSucceededPayload {
                                    endpoint_id: remote.to_string(),
                                    name: candidate_name.clone(),
                                });
                                succeeded = true;
                                break 'connection;
                            }
                            drop(data);
                            if let Some(sender) = verdict_sender {
                                let _ = sender.try_send(false);
                            }
                        }
                    }
                }
            }
        }
    }

    // The verifier sends the accept verdict on this connection, then the submitter reads it and closes first. Hold the connection open until the submitter closes (bounded by a timeout) so a local close does not truncate the verdict frame in flight — otherwise the submitter reports a spurious "connection closed before a verdict arrived" and never persists the peer.
    if succeeded && sent_accept_verdict {
        let _ = tokio::time::timeout(Duration::from_secs(5), connection.closed()).await;
    }

    eprintln!(
        "[connectivity] pairing connection with {remote} closed (succeeded={succeeded}, close_reason={:?})",
        connection.close_reason()
    );
    connection.close(0u32.into(), b"pairing closed");

    let mut data = state.lock().await;
    let mut candidate_was_listed = false;
    if let Some(session) = data.pairing.as_mut() {
        session.probing.remove(&remote);
        let owns_entry = session
            .candidates
            .get(&remote)
            .is_some_and(|candidate| candidate.frame_sender.same_channel(&frame_sender));
        if owns_entry {
            session.candidates.remove(&remote);
            candidate_was_listed = true;
        }
    }
    drop(data);
    if candidate_was_listed && !succeeded {
        let _ = app.emit(
            EVENT_PAIRING_CANDIDATE_LOST,
            PairingCandidateLostPayload {
                endpoint_id: remote.to_string(),
            },
        );
    }

    if succeeded {
        // The normal auto-connect rule establishes the gm-tool connection; mDNS resolves
        // the bare id to dialable addresses.
        maybe_dial_trusted_peer(&app, &state, EndpointAddr::from(remote)).await;
    }
}

async fn send_verdict(send_stream: &mut iroh::endpoint::SendStream, accepted: bool) {
    if let Ok(verdict_json) = serde_json::to_string(&PairingFrame::CodeVerdict { accepted }) {
        let _ = write_frame(send_stream, &verdict_json).await;
    }
}

async fn remove_probe(state: &ConnectivityState, remote: &EndpointId) {
    let mut data = state.lock().await;
    if let Some(session) = data.pairing.as_mut() {
        session.probing.remove(remote);
    }
}
