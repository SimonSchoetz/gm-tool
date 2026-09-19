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
    EVENT_PAIRING_CANDIDATE_LOST, EVENT_PAIRING_CODE_REQUESTED, EVENT_PAIRING_FAILED,
    EVENT_PAIRING_SUCCEEDED, PairingCandidateLostPayload, PairingCandidatePayload,
    PairingCodeRequestedPayload, PairingFailedPayload, PairingSucceededPayload,
    is_preferred_direction, parse_endpoint_id,
};

const MAX_CODE_FAILURES: u8 = 3;
const VERDICT_TIMEOUT: Duration = Duration::from_secs(10);

pub(crate) struct PairingSession {
    pub(crate) code: String,
    pub(crate) candidates: HashMap<EndpointId, PairingCandidate>,
    pub(crate) probing: HashSet<EndpointId>,
    // Session-wide, not per device: endpoint ids are free to generate, so a per-device count would not bound guesses against the 6-digit code. It is never reset and ends with the session, whose code rotates when the dialog is reopened.
    pub(crate) code_failures: u8,
    // Number of live enter_pairing_mode calls not yet matched by an exit. React StrictMode double-mounts the dialog in dev (enter, exit, enter in arbitrary async order), so the session is torn down only when the last holder exits — a stale exit cannot wipe a session another mount still holds.
    pub(crate) ref_count: u32,
}

pub(crate) struct PairingCandidate {
    pub(crate) frame_sender: Sender<PairingFrame>,
    pub(crate) pending_verdict: Option<Sender<bool>>,
    // `Connection::stable_id()` of the connection that registered this candidate.
    pub(crate) connection_id: usize,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub(crate) enum PairingFrame {
    #[serde(rename_all = "camelCase")]
    PairingHello {
        endpoint_id: String,
        name: Option<String>,
    },
    CodeRequest,
    #[serde(rename_all = "camelCase")]
    CodeSubmit {
        code: String,
    },
    #[serde(rename_all = "camelCase")]
    CodeVerdict {
        accepted: bool,
    },
}

pub(crate) enum CodeSubmitOutcome {
    Accepted,
    Rejected,
    LimitReached,
}

/// Decides one code submitted to this device. The limit is checked before the code is compared, so a device over the limit cannot succeed with a correct guess, and a wrong code from any device counts toward the same limit.
pub(crate) fn evaluate_code_submit(
    session: &mut PairingSession,
    trusted: &mut HashSet<EndpointId>,
    remote: EndpointId,
    code: &str,
) -> CodeSubmitOutcome {
    if session.code_failures >= MAX_CODE_FAILURES {
        session.candidates.remove(&remote);
        session.probing.remove(&remote);
        return CodeSubmitOutcome::LimitReached;
    }
    if code == session.code {
        session.candidates.remove(&remote);
        session.probing.remove(&remote);
        trusted.insert(remote);
        return CodeSubmitOutcome::Accepted;
    }
    session.code_failures += 1;
    if session.code_failures >= MAX_CODE_FAILURES {
        session.candidates.remove(&remote);
        session.probing.remove(&remote);
        return CodeSubmitOutcome::LimitReached;
    }
    CodeSubmitOutcome::Rejected
}

pub(crate) enum CodeVerdictOutcome {
    Ignored,
    Accepted(Sender<bool>),
    Rejected(Sender<bool>),
}

/// Applies a peer's verdict on a code this device submitted. Only a submission this device is still waiting on can create trust: a verdict with no pending submission, or whose waiter has already given up, is ignored.
pub(crate) fn evaluate_code_verdict(
    session: &mut PairingSession,
    trusted: &mut HashSet<EndpointId>,
    remote: EndpointId,
    accepted: bool,
) -> CodeVerdictOutcome {
    let Some(candidate) = session.candidates.get_mut(&remote) else {
        return CodeVerdictOutcome::Ignored;
    };
    let Some(verdict_sender) = candidate.pending_verdict.take() else {
        return CodeVerdictOutcome::Ignored;
    };
    if verdict_sender.is_closed() {
        return CodeVerdictOutcome::Ignored;
    }
    if accepted {
        session.candidates.remove(&remote);
        session.probing.remove(&remote);
        trusted.insert(remote);
        return CodeVerdictOutcome::Accepted(verdict_sender);
    }
    CodeVerdictOutcome::Rejected(verdict_sender)
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
            return Ok(session.code.clone());
        }
        let code = format!("{:06}", rand::random_range(0..=999_999u32));
        data.pairing = Some(PairingSession {
            code: code.clone(),
            candidates: HashMap::new(),
            probing: HashSet::new(),
            code_failures: 0,
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

    // Probe every already-known unpaired endpoint immediately rather than waiting for mDNS to re-announce it, so a session started after discovery still surfaces candidates without delay.
    for addr in known_unpaired {
        maybe_probe_candidate(app, state, addr).await;
    }

    Ok(code)
}

pub async fn exit_pairing_mode(state: &ConnectivityState) -> Result<(), String> {
    let mut data = state.lock().await;
    if let Some(session) = &mut data.pairing {
        session.ref_count = session.ref_count.saturating_sub(1);
        if session.ref_count == 0 {
            // Dropping the session drops every candidate's frame sender, which terminates the candidate tasks and closes their connections.
            data.pairing = None;
        }
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

/// Asks a candidate to display its pairing code. Fire-and-forget: no verdict is awaited and no candidate state is touched — TypeScript owns every role decision.
pub async fn request_pairing_code(
    state: &ConnectivityState,
    endpoint_id: &str,
) -> Result<(), String> {
    let remote = parse_endpoint_id(endpoint_id)?;
    let frame_sender = {
        let data = state.lock().await;
        let session = data
            .pairing
            .as_ref()
            .ok_or_else(|| "No active pairing session".to_string())?;
        let candidate = session
            .candidates
            .get(&remote)
            .ok_or_else(|| format!("Unknown pairing candidate {endpoint_id}"))?;
        candidate.frame_sender.clone()
    };

    frame_sender
        .send(PairingFrame::CodeRequest)
        .await
        .map_err(|_| "The pairing connection to this device closed".to_string())
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
        match endpoint.connect(addr, ALPN_PAIRING).await {
            Ok(connection) => {
                run_pairing_connection(app, state, connection, ConnectionRole::Dialer).await;
            }
            Err(_) => {
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
    let connection_id = connection.stable_id();

    let streams = match role {
        ConnectionRole::Dialer => connection.open_bi().await,
        ConnectionRole::Acceptor => connection.accept_bi().await,
    };
    let Ok((mut send_stream, mut recv_stream)) = streams else {
        remove_probe(&state, &remote).await;
        return;
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
        remove_probe(&state, &remote).await;
        return;
    }

    let (frame_sender, mut frame_receiver) = channel::<PairingFrame>(8);
    // Moved into the session's candidate entry when the peer's hello arrives; the entry then holds the only sender, so dropping the session or replacing the entry closes the channel and ends this task.
    let mut sender_to_register = Some(frame_sender);
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
                            let mut guard = state.lock().await;
                            let data = &mut *guard;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            // Both devices may dial each other at once, giving two candidate connections. Each device keeps the preferred one, so neither closes the connection the other keeps.
                            if session.candidates.contains_key(&remote)
                                && !is_preferred_direction(
                                    role,
                                    data.endpoint.as_ref().map(|endpoint| endpoint.id()),
                                    remote,
                                )
                            {
                                break 'connection;
                            }
                            candidate_name = name.clone();
                            session.candidates.insert(remote, PairingCandidate {
                                frame_sender: sender,
                                pending_verdict: None,
                                connection_id,
                            });
                            drop(guard);
                            let _ = app.emit(EVENT_PAIRING_CANDIDATE, PairingCandidatePayload {
                                endpoint_id: remote.to_string(),
                                name,
                            });
                        }
                        PairingFrame::CodeRequest => {
                            // Relayed unfiltered: the "already committed as initiator" guard lives in usePairing, not here.
                            let _ = app.emit(
                                EVENT_PAIRING_CODE_REQUESTED,
                                PairingCodeRequestedPayload {
                                    endpoint_id: remote.to_string(),
                                },
                            );
                        }
                        PairingFrame::CodeSubmit { code } => {
                            let mut guard = state.lock().await;
                            let data = &mut *guard;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            let outcome =
                                evaluate_code_submit(session, &mut data.trusted, remote, &code);
                            drop(guard);
                            match outcome {
                                CodeSubmitOutcome::Accepted => {
                                    send_verdict(&mut send_stream, true).await;
                                    sent_accept_verdict = true;
                                    let _ = app.emit(EVENT_PAIRING_SUCCEEDED, PairingSucceededPayload {
                                        endpoint_id: remote.to_string(),
                                        name: candidate_name.clone(),
                                    });
                                    succeeded = true;
                                    break 'connection;
                                }
                                CodeSubmitOutcome::Rejected => {
                                    send_verdict(&mut send_stream, false).await;
                                }
                                CodeSubmitOutcome::LimitReached => {
                                    send_verdict(&mut send_stream, false).await;
                                    let _ = app.emit(EVENT_PAIRING_FAILED, PairingFailedPayload {
                                        endpoint_id: remote.to_string(),
                                        reason: "attempt limit reached".to_string(),
                                    });
                                    break 'connection;
                                }
                            }
                        }
                        PairingFrame::CodeVerdict { accepted } => {
                            let mut guard = state.lock().await;
                            let data = &mut *guard;
                            let Some(session) = data.pairing.as_mut() else {
                                break 'connection;
                            };
                            let outcome =
                                evaluate_code_verdict(session, &mut data.trusted, remote, accepted);
                            drop(guard);
                            match outcome {
                                CodeVerdictOutcome::Ignored => {}
                                CodeVerdictOutcome::Accepted(sender) => {
                                    let _ = sender.try_send(true);
                                    let _ = app.emit(EVENT_PAIRING_SUCCEEDED, PairingSucceededPayload {
                                        endpoint_id: remote.to_string(),
                                        name: candidate_name.clone(),
                                    });
                                    succeeded = true;
                                    break 'connection;
                                }
                                CodeVerdictOutcome::Rejected(sender) => {
                                    let _ = sender.try_send(false);
                                }
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

    connection.close(0u32.into(), b"pairing closed");

    let mut data = state.lock().await;
    let mut candidate_was_listed = false;
    if let Some(session) = data.pairing.as_mut() {
        session.probing.remove(&remote);
        let owns_entry = session
            .candidates
            .get(&remote)
            .is_some_and(|candidate| candidate.connection_id == connection_id);
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
        // The normal auto-connect rule establishes the gm-tool connection; mDNS resolves the bare id to dialable addresses.
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

#[cfg(test)]
mod tests {
    use tauri::async_runtime::Receiver;

    use super::*;
    use crate::connectivity::test_endpoint_id;

    const CODE: &str = "123456";
    const WRONG_CODE: &str = "000000";

    // Every registered candidate is also being probed, as in the live flow (`maybe_probe_candidate`), so a path that forgets to remove it from `probing` fails.
    fn session_with_candidates(remotes: &[EndpointId]) -> PairingSession {
        let mut session = PairingSession {
            code: CODE.to_string(),
            candidates: HashMap::new(),
            probing: HashSet::new(),
            code_failures: 0,
            ref_count: 1,
        };
        for remote in remotes {
            let (frame_sender, _frame_receiver) = channel::<PairingFrame>(1);
            session.candidates.insert(
                *remote,
                PairingCandidate {
                    frame_sender,
                    pending_verdict: None,
                    connection_id: 0,
                },
            );
            session.probing.insert(*remote);
        }
        session
    }

    // The waiter counts as alive only while the returned receiver stays bound.
    fn wait_for_verdict(session: &mut PairingSession, remote: EndpointId) -> Receiver<bool> {
        let (verdict_sender, verdict_receiver) = channel::<bool>(1);
        session
            .candidates
            .get_mut(&remote)
            .expect("candidate is registered")
            .pending_verdict = Some(verdict_sender);
        verdict_receiver
    }

    #[test]
    fn accept_verdict_without_a_pending_submission_trusts_nobody() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();

        let outcome = evaluate_code_verdict(&mut session, &mut trusted, remote, true);

        assert!(matches!(outcome, CodeVerdictOutcome::Ignored));
        assert!(trusted.is_empty());
        assert!(session.candidates.contains_key(&remote));
    }

    #[test]
    fn accept_verdict_after_the_waiter_gave_up_trusts_nobody() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();
        drop(wait_for_verdict(&mut session, remote));

        let outcome = evaluate_code_verdict(&mut session, &mut trusted, remote, true);

        assert!(matches!(outcome, CodeVerdictOutcome::Ignored));
        assert!(trusted.is_empty());
        let candidate = session
            .candidates
            .get(&remote)
            .expect("candidate stays listed");
        assert!(candidate.pending_verdict.is_none());
    }

    #[test]
    fn accept_verdict_for_a_pending_submission_trusts_the_remote() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();
        let mut verdict_receiver = wait_for_verdict(&mut session, remote);

        let outcome = evaluate_code_verdict(&mut session, &mut trusted, remote, true);

        let CodeVerdictOutcome::Accepted(verdict_sender) = outcome else {
            panic!("expected an accepted verdict outcome");
        };
        assert!(trusted.contains(&remote));
        assert!(!session.candidates.contains_key(&remote));
        assert!(!session.probing.contains(&remote));
        // The returned sender is the waiter's own, so the submitter learns the verdict.
        verdict_sender.try_send(true).expect("waiter is alive");
        assert_eq!(verdict_receiver.try_recv(), Ok(true));
    }

    #[test]
    fn reject_verdict_for_a_pending_submission_clears_the_pending_sender() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();
        let mut verdict_receiver = wait_for_verdict(&mut session, remote);

        let outcome = evaluate_code_verdict(&mut session, &mut trusted, remote, false);

        let CodeVerdictOutcome::Rejected(verdict_sender) = outcome else {
            panic!("expected a rejected verdict outcome");
        };
        assert!(trusted.is_empty());
        let candidate = session
            .candidates
            .get(&remote)
            .expect("candidate stays listed");
        assert!(candidate.pending_verdict.is_none());
        verdict_sender.try_send(false).expect("waiter is alive");
        assert_eq!(verdict_receiver.try_recv(), Ok(false));
    }

    #[test]
    fn correct_code_trusts_the_remote_and_removes_its_candidate() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();

        let outcome = evaluate_code_submit(&mut session, &mut trusted, remote, CODE);

        assert!(matches!(outcome, CodeSubmitOutcome::Accepted));
        assert!(trusted.contains(&remote));
        assert!(!session.candidates.contains_key(&remote));
        assert!(!session.probing.contains(&remote));
    }

    #[test]
    fn third_wrong_code_reaches_the_limit_and_removes_the_candidate() {
        let remote = test_endpoint_id(1);
        let mut session = session_with_candidates(&[remote]);
        let mut trusted = HashSet::new();

        for _ in 0..2 {
            let outcome = evaluate_code_submit(&mut session, &mut trusted, remote, WRONG_CODE);
            assert!(matches!(outcome, CodeSubmitOutcome::Rejected));
            assert!(session.candidates.contains_key(&remote));
        }
        let outcome = evaluate_code_submit(&mut session, &mut trusted, remote, WRONG_CODE);

        assert!(matches!(outcome, CodeSubmitOutcome::LimitReached));
        assert!(!session.candidates.contains_key(&remote));
        assert!(!session.probing.contains(&remote));
        assert!(trusted.is_empty());
    }

    #[test]
    fn correct_code_from_another_device_is_refused_after_the_limit() {
        let (locked_out, other) = (test_endpoint_id(1), test_endpoint_id(2));
        let mut session = session_with_candidates(&[locked_out, other]);
        let mut trusted = HashSet::new();
        for _ in 0..3 {
            evaluate_code_submit(&mut session, &mut trusted, locked_out, WRONG_CODE);
        }

        let outcome = evaluate_code_submit(&mut session, &mut trusted, other, CODE);

        assert!(matches!(outcome, CodeSubmitOutcome::LimitReached));
        assert!(trusted.is_empty());
        assert!(!session.candidates.contains_key(&other));
    }

    #[test]
    fn wrong_codes_from_three_devices_lock_the_session_for_a_fourth() {
        let devices = [1, 2, 3, 4].map(test_endpoint_id);
        let mut session = session_with_candidates(&devices);
        let mut trusted = HashSet::new();

        for device in &devices[..2] {
            let outcome = evaluate_code_submit(&mut session, &mut trusted, *device, WRONG_CODE);
            assert!(matches!(outcome, CodeSubmitOutcome::Rejected));
        }
        let third = evaluate_code_submit(&mut session, &mut trusted, devices[2], WRONG_CODE);
        assert!(matches!(third, CodeSubmitOutcome::LimitReached));

        let fourth = evaluate_code_submit(&mut session, &mut trusted, devices[3], WRONG_CODE);
        assert!(matches!(fourth, CodeSubmitOutcome::LimitReached));
    }
}
