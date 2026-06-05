use std::sync::Mutex;
use tauri_plugin_updater::Update;

pub struct PendingInstall {
    pub update: Update,
    pub bytes: Vec<u8>,
}

pub type PendingInstallState = Mutex<Option<PendingInstall>>;
