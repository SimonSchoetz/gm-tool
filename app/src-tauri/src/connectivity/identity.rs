use std::fs;

use iroh::SecretKey;
use tauri::{AppHandle, Manager};

pub(crate) fn load_or_create_secret_key(app_handle: &AppHandle) -> Result<SecretKey, String> {
    let key_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?
        .join("connectivity");
    let key_path = key_dir.join("device.key");

    if key_path.exists() {
        let content = fs::read_to_string(&key_path)
            .map_err(|e| format!("Failed to read device key file: {e}"))?;
        let bytes = decode_hex_key(content.trim())?;
        return Ok(SecretKey::from_bytes(&bytes));
    }

    let secret_key = SecretKey::generate();
    fs::create_dir_all(&key_dir)
        .map_err(|e| format!("Failed to create connectivity directory: {e}"))?;
    fs::write(&key_path, encode_hex_key(&secret_key.to_bytes()))
        .map_err(|e| format!("Failed to write device key file: {e}"))?;
    Ok(secret_key)
}

fn encode_hex_key(bytes: &[u8; 32]) -> String {
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn decode_hex_key(hex: &str) -> Result<[u8; 32], String> {
    if hex.len() != 64 {
        return Err(format!(
            "Device key file is corrupted: expected 64 hex characters, found {}",
            hex.len()
        ));
    }
    let mut bytes = [0u8; 32];
    for (index, pair) in hex.as_bytes().chunks(2).enumerate() {
        let pair = std::str::from_utf8(pair)
            .map_err(|_| "Device key file is corrupted: not valid ASCII".to_string())?;
        bytes[index] = u8::from_str_radix(pair, 16)
            .map_err(|_| format!("Device key file is corrupted: '{pair}' is not hex"))?;
    }
    Ok(bytes)
}
