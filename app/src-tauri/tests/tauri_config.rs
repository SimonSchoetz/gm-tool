use std::env;
use std::fs;
use std::path::PathBuf;

use serde_json::Value;

/// Guards app.windows[0].dragDropEnabled staying false: Tauri's webview intercepts native HTML5 drag-and-drop on Windows unless this is disabled, which the text editor's block-drag-handle feature (app/src/components/TextEditor/plugins/BlockDragHandlePlugin/) depends on — see .claude/knowledge/tauri.md for the verified mechanism.
#[test]
fn drag_drop_disabled_for_block_drag_handle() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let raw = fs::read_to_string(manifest_dir.join("tauri.conf.json"))
        .expect("failed to read tauri.conf.json");
    let config: Value = serde_json::from_str(&raw).expect("tauri.conf.json is not valid JSON");

    let drag_drop_enabled = config
        .get("app")
        .and_then(|v| v.get("windows"))
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("dragDropEnabled"))
        .and_then(Value::as_bool)
        .expect("app.windows[0].dragDropEnabled must be present and a boolean");

    assert!(
        !drag_drop_enabled,
        "app.windows[0].dragDropEnabled must stay false — reverting it silently breaks the text editor's block-drag-handle feature, whose native dragover/drop DOM events Tauri's webview otherwise intercepts on Windows; see .claude/knowledge/tauri.md"
    );
}
