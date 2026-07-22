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

## iroh 1.0.2 Endpoint::builder requires a preset argument; presets::Minimal is the LAN-only base

**Verified at:** iroh 1.0.2
**Citation:** [I_1: ~/.cargo/registry/src/.../iroh-1.0.2/src/endpoint.rs:950 — `pub fn builder(preset: impl Preset) -> Builder`; endpoint/presets.rs — `Empty`, `Minimal`, `N0`, `N0DisableRelay`]

`Endpoint::builder(preset)` takes a mandatory `impl Preset`. `presets::Minimal` sets only the mandatory rustls crypto provider (ring) and adds no address lookup or relay services; `presets::N0` additionally adds a Pkarr publisher, DNS address lookup, and the default relay mode. For LAN-only operation, `Minimal` + `relay_mode(RelayMode::Disabled)` + mDNS lookup is the correct base — nothing needs clearing.

## iroh 1.0.2 accept flow: Accept → Option<Incoming> → Accepting → Connection

**Verified at:** iroh 1.0.2
**Citation:** [I_2: iroh-1.0.2/src/endpoint.rs:1162, endpoint/connection.rs:106,147,660 — read in source]

`endpoint.accept().await` yields `Option<Incoming>` (`None` when the endpoint is closed); `Incoming::accept()` returns `Result<Accepting, ConnectionError>`; awaiting `Accepting` yields `Result<Connection, ConnectingError>`. `Connection<HandshakeCompleted>::alpn()` returns `&[u8]` and `remote_id()` returns `EndpointId` (connection.rs:1115,1127). `Connection::close(VarInt, &[u8])` closes; `closed().await` yields `ConnectionError` when the connection ends.

## iroh 1.0.2 bi-streams resolve to (SendStream, RecvStream) with inherent async read/write

**Verified at:** iroh 1.0.2 (noq 1.0.1)
**Citation:** [I_3: noq-1.0.1/src/connection.rs:982,1049 — `type Output = Result<(SendStream, RecvStream), ConnectionError>`; send_stream.rs:74 `write_all`; recv_stream.rs:76 `read(&mut buf) -> Result<Option<usize>, ReadError>`]

`open_bi()`/`accept_bi()` futures resolve to `(SendStream, RecvStream)`. Streams have inherent `async fn write_all(&mut self, &[u8])` and `async fn read(&mut self, &mut [u8]) -> Result<Option<usize>, ReadError>` (`None` = stream finished); they also implement tokio `AsyncRead`/`AsyncWrite` (recv_stream.rs:588, send_stream.rs:329).

## MdnsAddressLookup is Clone, buildable pre-bind, attachable post-bind, and exposes subscribe()

**Verified at:** iroh-mdns-address-lookup 0.4.0
**Citation:** [I_4: iroh-mdns-address-lookup-0.4.0/src/lib.rs:102,211,255,462,570 — read in source]

`MdnsAddressLookup` derives `Clone` and implements `AddressLookup`. `MdnsAddressLookup::builder().build(endpoint_id)` constructs it directly (requires a running tokio runtime; panics outside one). `endpoint.address_lookup()?.add(service)` attaches it after bind — required when a handle must be kept, because `AddressLookupServices` stores services as `Box<dyn AddressLookup>` with no typed getter. `subscribe().await` returns `impl Stream<Item = DiscoveryEvent> + Unpin`; `DiscoveryEvent` is `Discovered { endpoint_info: EndpointInfo, last_updated: Option<u64> }` or `Expired { endpoint_id: EndpointId }` (non_exhaustive).

## EndpointInfo carries endpoint_id and converts into a dialable EndpointAddr

**Verified at:** iroh 1.0.2 (iroh-dns 1.0.2)
**Citation:** [I_5: iroh-dns-1.0.2/src/endpoint_info.rs:357-417 — `pub endpoint_id: EndpointId`, `impl From<EndpointInfo> for EndpointAddr`, `into_endpoint_addr()`]

`EndpointInfo` has a public `endpoint_id` field and converts to `EndpointAddr` via `From`/`into_endpoint_addr()`; `Endpoint::connect(impl Into<EndpointAddr>, alpn: &[u8])` accepts it directly.

## iroh-mdns-address-lookup 0.4.0 joins multicast only on the default-route interface

**Verified at:** iroh-mdns-address-lookup 0.4.0 (swarm-discovery 0.6.3)
**Citation:** [I_7: swarm-discovery-0.6.3/src/socket.rs:100-160 — `socket_v4(None)` joins 224.0.0.251 on `Ipv4Addr::UNSPECIFIED` (kernel default route interface); iroh-mdns-address-lookup-0.4.0/src/lib.rs:472-509 — `spawn_discoverer` never calls `with_multicast_interfaces_v4` or `add_interface_v4`, so no per-interface sockets or group joins exist]

On multi-homed hosts the mDNS discoverer sends and receives multicast solely on the interface the OS picks for 224.0.0.0/4 — decided on Windows by lowest interface metric. VPN adapters (e.g. NordLynx, metric 5 vs. Wi-Fi 35) capture it even when the VPN session is "disconnected" but the adapter stays up, making discovery silently dead in both directions while init succeeds. swarm-discovery's `Discoverer::with_multicast_interfaces_v4`/`DropGuard::add_interface_v4` could fix this, but the 0.4.0 wrapper does not expose them.

## iroh-mdns-address-lookup emits `Discovered` repeatedly for the same peer, not once

**Verified at:** iroh 1.0.2 / iroh-mdns-address-lookup 0.4.0, observed 2026-07-22
**Citation:** [I_11: ran `npm run dev` with an eprintln on every `DiscoveryEvent` in `connectivity/connections.rs::run_discovery` — observed 10+ consecutive `Discovered` events for the same peer id within one session, no intervening `Expired`]

`app/src-tauri/CLAUDE.md`'s `enter_pairing_mode` description and the `enter_pairing_mode` comment in `connectivity/pairing.rs` both state that mDNS emits `Discovered` once per peer and that republished announcements are dropped. Direct observation contradicts this: the same peer id is re-delivered repeatedly while the discovery loop runs.

Consequences: any handler reached from `handle_discovered` must be idempotent, since it is invoked many times per peer (`maybe_dial_trusted_peer` and `maybe_probe_candidate` both already guard on `connections`/`dialing` and `probing`/`candidates`, so both are safe). Conversely, never diagnose a peer's failure to (re)connect as "the second discovery event never arrives" — that premise is false, and a repeated `Discovered` means the failure lies downstream in the dial or accept path.

## iroh connections idle out after 30s by default; a dead peer is not detected sooner without a graceful close

**Verified at:** iroh 1.0.2
**Citation:** [I_8: iroh-1.0.2/src/endpoint/quic.rs:187-190 — `max_idle_timeout` doc: "The true idle timeout is the minimum of this and the peer's own max idle timeout. `None` represents an infinite timeout. Defaults to 30 seconds."; quic.rs:151-163 — `QuicTransportConfigBuilder::new` sets only `keep_alive_interval`/`default_path_keep_alive_interval` (HEARTBEAT_INTERVAL) and `default_path_max_idle_timeout` (PATH_MAX_IDLE_TIMEOUT), never `max_idle_timeout`; socket.rs:109,117 — HEARTBEAT_INTERVAL = 5s, PATH_MAX_IDLE_TIMEOUT = 15s]

A peer whose process exits without sending CONNECTION_CLOSE stays in the local live-connection set until the ~30s connection idle timeout expires, so any UI derived from that set shows the peer as connected for up to 30s. Override with `Endpoint::builder(..).transport_config(QuicTransportConfig::builder().max_idle_timeout(..).build())` [I_9: endpoint.rs:669 `pub fn transport_config(mut self, transport_config: QuicTransportConfig) -> Self`], and/or call `Endpoint::close()` on app shutdown [I_10: endpoint.rs:1697 `pub async fn close(&self)`] so peers are notified immediately.

## iroh requires at least one ALPN protocol identifier when accepting connections

**Verified at:** iroh 1.0.2
**Citation:** [A_9: https://docs.rs/iroh/latest/iroh/]

When accepting connections "at least one ALPN must be configured" (e.g. `alpns(vec![b"hello-world".to_vec()])`); ALPN is used by both sides to agree on the application-specific protocol running over the QUIC connection.
