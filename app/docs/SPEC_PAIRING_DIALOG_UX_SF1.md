## Sub-feature 1: Rust pairing protocol

Adds a new wire frame (`CodeRequest`) that an initiator sends to ask a candidate to display its code, a Rust function to send it, and the Tauri command that exposes that function to the frontend.

### Files affected

Modified:

- `app/src-tauri/src/connectivity/pairing.rs`
- `app/src-tauri/src/connectivity/mod.rs`
- `app/src-tauri/src/commands/connectivity/mod.rs`
- `app/src-tauri/src/commands/mod.rs`
- `app/src-tauri/src/lib.rs`

New:

- `app/src-tauri/src/commands/connectivity/request_pairing_code.rs`

### Backend (Rust)

**`app/src-tauri/src/connectivity/mod.rs`**

Insert a new event constant directly after `EVENT_PAIRING_CANDIDATE_LOST` (before `EVENT_PAIRING_SUCCEEDED`):

```rust
pub(crate) const EVENT_PAIRING_CODE_REQUESTED: &str = "connectivity-pairing-code-requested";
```

Insert a new payload struct directly after `PairingCandidateLostPayload`'s struct block (before `PairingSucceededPayload`'s struct block), same shape as `PairingCandidateLostPayload`:

```rust
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PairingCodeRequestedPayload {
    pub(crate) endpoint_id: String,
}
```

Change the `pub use pairing::{...}` re-export line to add `request_pairing_code`:

```rust
pub use pairing::{
    enter_pairing_mode, exit_pairing_mode, request_pairing_code, submit_pairing_code,
};
```

**`app/src-tauri/src/connectivity/pairing.rs`**

Change the `use super::{...}` import block (lines 11-16) to add `EVENT_PAIRING_CODE_REQUESTED` and `PairingCodeRequestedPayload`:

```rust
use super::{
    ALPN_PAIRING, ConnectionRole, ConnectivityState, EVENT_PAIRING_CANDIDATE,
    EVENT_PAIRING_CANDIDATE_LOST, EVENT_PAIRING_CODE_REQUESTED, EVENT_PAIRING_FAILED,
    EVENT_PAIRING_SUCCEEDED, PairingCandidateLostPayload, PairingCandidatePayload,
    PairingCodeRequestedPayload, PairingFailedPayload, PairingSucceededPayload,
    parse_endpoint_id,
};
```

Add a `CodeRequest` unit variant to `PairingFrame` (lines 35-47), between `PairingHello` and `CodeSubmit`. It carries no fields, so it needs no per-variant `rename_all` attribute:

```rust
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
    CodeSubmit { code: String },
    #[serde(rename_all = "camelCase")]
    CodeVerdict { accepted: bool },
}
```

Add `request_pairing_code` directly after `submit_pairing_code` (after line 147, before the `maybe_probe_candidate` doc comment on line 149). It mirrors `submit_pairing_code`'s candidate/frame_sender lookup, but read-only — no `pending_verdict` is touched, and there is no verdict wait. This is fire-and-forget from Rust's side; TypeScript owns all role logic:

```rust
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
```

Insert a new match arm in `run_pairing_connection`'s `match frame { ... }` block, directly after the `PairingFrame::PairingHello { ... }` arm closes (after line 287's `}`, before line 288's `PairingFrame::CodeSubmit { code } => {`). This anchor is valid because `app`, `remote`, `EVENT_PAIRING_CODE_REQUESTED`, and `PairingCodeRequestedPayload` are all already in scope at that point:

```rust
                        PairingFrame::CodeRequest => {
                            let _ = app.emit(
                                EVENT_PAIRING_CODE_REQUESTED,
                                PairingCodeRequestedPayload {
                                    endpoint_id: remote.to_string(),
                                },
                            );
                        }
```

This arm only relays the frame as an event — it deliberately contains no "is the receiver already committed" check. See the root spec's Key Architectural Decisions — "Rust is a secure pipe — TypeScript owns the commitment guard."

**`app/src-tauri/src/commands/connectivity/request_pairing_code.rs`** (new)

Thin wrapper, same shape as `submit_pairing_code.rs` minus the `code` parameter:

```rust
use tauri::State;

use crate::connectivity::{self, ConnectivityState};

#[tauri::command]
pub async fn request_pairing_code(
    state: State<'_, ConnectivityState>,
    endpoint_id: String,
) -> Result<(), String> {
    connectivity::request_pairing_code(state.inner(), &endpoint_id).await
}
```

**`app/src-tauri/src/commands/connectivity/mod.rs`**

Add `mod request_pairing_code;` alphabetically between `mod remove_trusted_peer;` and `mod send_message;`, and `pub use request_pairing_code::request_pairing_code;` alphabetically between the `remove_trusted_peer` and `send_message` re-export lines:

```rust
mod enter_pairing_mode;
mod exit_pairing_mode;
mod get_connected_peers;
mod init_connectivity;
mod remove_trusted_peer;
mod request_pairing_code;
mod send_message;
mod submit_pairing_code;
mod update_own_name;

pub use enter_pairing_mode::enter_pairing_mode;
pub use exit_pairing_mode::exit_pairing_mode;
pub use get_connected_peers::get_connected_peers;
pub use init_connectivity::init_connectivity;
pub use remove_trusted_peer::remove_trusted_peer;
pub use request_pairing_code::request_pairing_code;
pub use send_message::send_message;
pub use submit_pairing_code::submit_pairing_code;
pub use update_own_name::update_own_name;
```

**`app/src-tauri/src/commands/mod.rs`**

Add `request_pairing_code` to the flat re-export list, alphabetically between `remove_trusted_peer` and `send_message`:

```rust
pub use connectivity::{
    enter_pairing_mode, exit_pairing_mode, get_connected_peers, init_connectivity,
    remove_trusted_peer, request_pairing_code, send_message, submit_pairing_code, update_own_name,
};
```

**`app/src-tauri/src/lib.rs`**

Add `request_pairing_code` to the `use commands::{...}` import list, alphabetically between `remove_trusted_peer` and `save_image`:

```rust
use commands::{
    PendingInstallState, check_update, delete_image, download_update, enter_pairing_mode,
    exit_pairing_mode, get_connected_peers, get_image_url, init_connectivity, install_and_relaunch,
    remove_trusted_peer, request_pairing_code, save_image, send_message, submit_pairing_code,
    update_own_name,
};
```

Add `request_pairing_code,` to the `tauri::generate_handler![...]` list, between `remove_trusted_peer,` and `save_image,`:

```rust
.invoke_handler(tauri::generate_handler![
    check_update,
    delete_image,
    download_update,
    enter_pairing_mode,
    exit_pairing_mode,
    get_connected_peers,
    get_image_url,
    init_connectivity,
    install_and_relaunch,
    remove_trusted_peer,
    request_pairing_code,
    save_image,
    send_message,
    submit_pairing_code,
    update_own_name,
])
```
