# Rust Crates

Verified facts about third-party Rust crates used in `app/src-tauri/`.

## base64: Engine trait methods encode byte slices and decode into `Vec<u8>`

**Verified at:** base64 0.22.1 (docs.rs/base64/0.22.1/base64/)
**Citation:** [I_1: WebFetch https://docs.rs/base64/0.22.1/base64/]

Encoding/decoding goes through the `Engine` trait, not free functions: `fn encode(&self, input: &[u8]) -> String` and `fn decode(&self, input: impl AsRef<[u8]>) -> Result<Vec<u8>, DecodeError>`. The crate ships a `prelude` module exposing pre-configured engines — `use base64::prelude::*;` brings in `BASE64_STANDARD`, used as `BASE64_STANDARD.encode(bytes)` / `BASE64_STANDARD.decode(input)?`. This is the standard-alphabet, padded engine and matches this codebase's use case (no custom alphabet/padding needs).
