# iroh

## iroh connections are QUIC-based and end-to-end encrypted, with direct P2P connections preferred over relays

**Verified at:** iroh 1.0.2 (docs.rs, released 2026-07-06)
**Citation:** [A_6: https://docs.iroh.computer/]

iroh establishes authenticated, end-to-end encrypted QUIC connections and "establishes direct connections whenever possible, falling back to relay servers if necessary."

## An iroh EndpointId is the public half of an Ed25519 keypair and cryptographically authenticates the peer

**Verified at:** iroh 1.0.2
**Citation:** [A_7: https://docs.iroh.computer/concepts/endpoints.md]

"An `EndpointID` (the public half of an Ed25519 keypair)." EndpointIDs are also the encryption mechanism — "all traffic is always encrypted for a specific endpoint only," so dialing an EndpointId guarantees the responder holds the corresponding private key.

## iroh supports LAN-only mDNS discovery and direct local connections without any relay or internet access

**Verified at:** iroh 1.0.2 + iroh-mdns-address-lookup 0.4
**Citation:** [A_8: https://docs.iroh.computer/connecting/local-address-lookup.md]

The separate `iroh-mdns-address-lookup` crate broadcasts endpoint presence on the local network and listens for announcements; "the dialing information is exchanged, and a connection can be established directly over the local network without needing a relay." mDNS does not work across networks. Enabled via the endpoint builder: `Endpoint::builder(presets::N0).address_lookup(MdnsAddressLookup::builder()).bind()`.

## The iroh endpoint Builder can disable relays and replace all address lookup services

**Verified at:** iroh 1.0.2
**Citation:** [S_1: https://docs.rs/iroh/latest/iroh/endpoint/struct.Builder.html]

Relevant Builder methods: `secret_key(SecretKey)` (generates a new key if unset), `alpns(Vec<Vec<u8>>)`, `address_lookup(impl AddressLookupBuilder)` (addable multiple times), `clear_address_lookup()` (removes all lookup services), `relay_mode(RelayMode)` with variants `RelayMode::Default`, `RelayMode::Disabled`, `RelayMode::Custom`, and `clear_relay_transports()`. LAN-only operation = `relay_mode(RelayMode::Disabled)` + `clear_address_lookup()` + adding only the mDNS lookup.

## iroh SecretKey generates via rand, round-trips through 32 bytes, and derives its PublicKey

**Verified at:** iroh 1.0.2
**Citation:** [S_2: https://docs.rs/iroh/latest/iroh/struct.SecretKey.html]

`SecretKey::generate()` uses the `rand` crate's default RNG; `to_bytes()` returns `[u8; 32]`; `from_bytes(&[u8; 32])` reconstructs; `public()` returns the `PublicKey`. Also implements `FromStr`, `Serialize`, `Deserialize`.

## iroh EndpointId is a type alias of PublicKey; Display is 64-char hex, FromStr parses hex or z-base-32

**Verified at:** iroh 1.0.2
**Citation:** [S_3: https://docs.rs/iroh/latest/iroh/type.EndpointId.html and struct.PublicKey.html — "pub type EndpointId = PublicKey"; "Parses a PublicKey from its hex or z-base-32 encoding. Display produces the hex encoding"; PublicKey::LENGTH = 32 bytes]

The conventional string form of a device/endpoint identity is the 64-character lowercase hex encoding produced by `Display`; `FromStr` accepts hex or z-base-32.

## iroh requires at least one ALPN protocol identifier when accepting connections

**Verified at:** iroh 1.0.2
**Citation:** [A_9: https://docs.rs/iroh/latest/iroh/]

When accepting connections "at least one ALPN must be configured" (e.g. `alpns(vec![b"hello-world".to_vec()])`); ALPN is used by both sides to agree on the application-specific protocol running over the QUIC connection.
