# iroh

## iroh connections are QUIC-based and end-to-end encrypted, with direct P2P connections preferred over relays

**Verified at:** iroh 1.2.0 (Cargo.lock), read 2026-09-21
**Citation:** [branch-review_1: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/lib.rs:1-5,70-72,83-85 — "Peer-to-peer QUIC connections.", "direct connectivity using [hole punching] complemented by relay servers", "attempt to create a direct connection … relay server is no longer involved", "encrypted using TLS … SecretKey used to authenticate and encrypt the connection"]

iroh establishes authenticated, end-to-end encrypted QUIC connections, attempts a direct connection between the two endpoints, and uses a relay server only as a complement while no direct path exists.

## An iroh EndpointId is the public half of an Ed25519 keypair and cryptographically authenticates the peer

**Verified at:** iroh-base 1.2.0 (Cargo.lock), read 2026-09-21
**Citation:** [branch-review_2: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-base-1.2.0/src/key.rs:60-62,70,107-108 — "mechanism by which all traffic is always encrypted for a specific endpoint only", `pub type EndpointId = PublicKey;`, "The length of an ed25519 `PublicKey`" / `ed25519_dalek::PUBLIC_KEY_LENGTH`] [branch-review_3: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/connection.rs:1129-1132 — "Returns the EndpointId from the peer's TLS certificate"]

An `EndpointId` is the public half of an Ed25519 keypair and is also the encryption mechanism, since all traffic is always encrypted for a specific endpoint only, so dialing an `EndpointId` guarantees the responder holds the corresponding private key, and an accepted connection's `remote_id()` comes from the peer's TLS certificate.

## iroh supports LAN-only mDNS discovery and direct local connections without any relay or internet access

**Verified at:** iroh 1.2.0, iroh-mdns-address-lookup 0.4.0 vendored, read 2026-09-21
**Citation:** [branch-review_4: app/src-tauri/vendor/iroh-mdns-address-lookup/src/lib.rs:1-3,225-231 — "on your local network, no relay or outside internet needed", `impl AddressLookupBuilder for MdnsAddressLookupBuilder`] [branch-review_5: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:612 — `pub fn address_lookup(mut self, address_lookup: impl AddressLookupBuilder) -> Self`]

The separate `iroh-mdns-address-lookup` crate broadcasts endpoint presence on the local network and listens for announcements, so the dialing information is exchanged and a connection is established directly over the local network without a relay; mDNS does not work across networks. It is enabled through the endpoint builder: `Endpoint::builder(preset).address_lookup(MdnsAddressLookup::builder()).bind()`.

## The iroh endpoint Builder can disable relays and replace all address lookup services

**Verified at:** iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_6: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:517,528-531,542,564,592,612,1985-1997 — `pub fn clear_relay_transports(mut self) -> Self`, "If not set, a new secret key will be generated." / `pub fn secret_key(mut self, secret_key: SecretKey)`, `pub fn alpns(mut self, alpn_protocols: Vec<Vec<u8>>)`, `pub fn relay_mode(mut self, relay_mode: RelayMode)`, `pub fn clear_address_lookup(mut self) -> Self`, `pub fn address_lookup(mut self, address_lookup: impl AddressLookupBuilder) -> Self`, `pub enum RelayMode { Disabled, Default, Staging, Custom(RelayMap) }`]

Relevant Builder methods: `secret_key(SecretKey)` (generates a new key if unset), `alpns(Vec<Vec<u8>>)`, `address_lookup(impl AddressLookupBuilder)` (addable multiple times), `clear_address_lookup()` (removes all lookup services), `relay_mode(RelayMode)` with variants `RelayMode::Default`, `RelayMode::Disabled`, `RelayMode::Staging`, `RelayMode::Custom`, and `clear_relay_transports()`. LAN-only operation = `relay_mode(RelayMode::Disabled)` + `clear_address_lookup()` + adding only the mDNS lookup.

## iroh SecretKey generates via rand, round-trips through 32 bytes, and derives its PublicKey

**Verified at:** iroh-base 1.2.0, read 2026-09-21
**Citation:** [branch-review_7: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-base-1.2.0/src/key.rs:269,278,287,299,306,318-319,332,337 — `impl FromStr for SecretKey`, `impl Serialize for SecretKey`, `impl<'de> Deserialize<'de> for SecretKey`, `pub fn public(&self) -> PublicKey`, "uses the default random number generator from the `rand` crate", `pub fn generate() -> Self { Self::from_bytes(&rand::random()) }`, `pub fn to_bytes(&self) -> [u8; 32]`, `pub fn from_bytes(bytes: &[u8; 32]) -> Self`]

`SecretKey::generate()` uses the `rand` crate's default RNG; `to_bytes()` returns `[u8; 32]`; `from_bytes(&[u8; 32])` reconstructs; `public()` returns the `PublicKey`. Also implements `FromStr`, `Serialize`, `Deserialize`.

## iroh EndpointId is a type alias of PublicKey; Display is 64-char lowercase hex, FromStr parses hex or RFC 4648 base32, and z-base-32 has its own `from_z32`/`to_z32`

**Verified at:** iroh-base 1.2.0, read 2026-09-21
**Citation:** [branch-review_8: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-base-1.2.0/src/key.rs:70,221-224,246-249,478-492 — `pub type EndpointId = PublicKey;`, `write!(f, "{}", data_encoding::HEXLOWER.encode(self.as_bytes()))`, "Parses a `PublicKey` from its hex or base32 encoding.", the hex branch taken when `s.len() == PublicKey::LENGTH * 2`, otherwise `s.to_ascii_uppercase()` decoded with `data_encoding::BASE32_NOPAD`] [branch-review_9: same file:162-172 — `pub fn to_z32(&self) -> String` and `pub fn from_z32(s: &str)` on the `Z_BASE_32` alphabet]

The conventional string form of a device/endpoint identity is the 64-character lowercase hex encoding produced by `Display`. `FromStr` decodes a 64-character input as lowercase hex and any other length as case-insensitive RFC 4648 base32 without padding; it does not accept z-base-32, which only `PublicKey::from_z32` and `to_z32` handle.

## Endpoint::builder requires a preset argument; presets::Minimal is the LAN-only base

**Verified at:** iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_10: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:960 — `pub fn builder(preset: impl Preset) -> Builder`] [branch-review_11: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/presets.rs:37,47-48,59-78,113,125-136,175 — `Empty`, "the only mandatory option … is Builder::crypto_provider", `pub struct Minimal;` setting only `crypto_provider`, `N0` adding `PkarrPublisher::n0_dns()`, `PkarrResolver::n0_dns()`, `DnsAddressLookup::n0_dns()` and `relay_mode(default_relay_mode())`, `N0DisableRelay`]

`Endpoint::builder(preset)` takes a mandatory `impl Preset`. `presets::Minimal` sets only the mandatory rustls crypto provider (ring) and adds no address lookup or relay services; `presets::N0` additionally adds a Pkarr publisher and resolver, DNS address lookup, and the default relay mode. For LAN-only operation, `Minimal` + `relay_mode(RelayMode::Disabled)` + mDNS lookup is the correct base — nothing needs clearing.

## The accept flow is `Accept` → `Option<Incoming>` → `Accepting` → `Connection`

**Verified at:** iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_12: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:1171-1173 — "yield `None` if the endpoint is closed", `pub fn accept(&self) -> Accept<'_>`] [branch-review_13: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/connection.rs:105-106,147,670-671,927,969,1123-1125,1137 — `impl Future for Accept<'_> { type Output = Option<Incoming>;`, `pub fn accept(self) -> Result<Accepting, ConnectionError>`, `impl Future for Accepting { type Output = Result<Connection, ConnectingError>;`, `pub async fn closed(&self) -> ConnectionError`, `pub fn close(&self, error_code: VarInt, reason: &[u8])`, `impl Connection<HandshakeCompleted>` / `pub fn alpn(&self) -> &[u8]`, `pub fn remote_id(&self) -> EndpointId`]

`endpoint.accept().await` yields `Option<Incoming>` (`None` when the endpoint is closed); `Incoming::accept()` returns `Result<Accepting, ConnectionError>`; awaiting `Accepting` yields `Result<Connection, ConnectingError>`. `Connection<HandshakeCompleted>::alpn()` returns `&[u8]` and `remote_id()` returns `EndpointId`. `Connection::close(VarInt, &[u8])` closes; `closed().await` yields `ConnectionError` when the connection ends.

## Bi-streams resolve to (SendStream, RecvStream) with inherent async read/write

**Verified at:** iroh 1.2.0 (noq 1.3.0), read 2026-09-21
**Citation:** [branch-review_14: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/connection.rs:1066-1067,1133-1134 — `impl Future for OpenBi<'_> { type Output = Result<(SendStream, RecvStream), ConnectionError>;` and the same `Output` for `AcceptBi`] [branch-review_15: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/send_stream.rs:74,333 — `pub async fn write_all(&mut self, mut buf: &[u8]) -> Result<(), WriteError>`, `impl tokio::io::AsyncWrite for SendStream`] [branch-review_16: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/recv_stream.rs:73-76,602 — "or `None` if the stream was finished" / `pub async fn read(&mut self, buf: &mut [u8]) -> Result<Option<usize>, ReadError>`, `impl tokio::io::AsyncRead for RecvStream`] [branch-review_17: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/quic.rs:15-45 — `pub use noq::{…, OpenBi, AcceptBi, SendStream, RecvStream, …}`]

`open_bi()`/`accept_bi()` futures resolve to `(SendStream, RecvStream)`. Streams have inherent `async fn write_all(&mut self, &[u8])` and `async fn read(&mut self, &mut [u8]) -> Result<Option<usize>, ReadError>` (`None` = stream finished); they also implement tokio `AsyncRead`/`AsyncWrite`.

## MdnsAddressLookup is Clone, buildable pre-bind, attachable post-bind, and exposes subscribe()

**Verified at:** iroh-mdns-address-lookup 0.4.0 vendored, iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_18: app/src-tauri/vendor/iroh-mdns-address-lookup/src/lib.rs:102-103,209-215,235-251,267,474,583 — `#[derive(Debug, Clone)] pub struct MdnsAddressLookup`, "will panic if called outside of the context of a tokio runtime" / `pub fn build(self, endpoint_id: EndpointId)`, `#[non_exhaustive] pub enum DiscoveryEvent { Discovered { endpoint_info: EndpointInfo, last_updated: Option<u64> }, Expired { endpoint_id: EndpointId } }`, `pub fn builder()`, `pub async fn subscribe(&self) -> impl Stream<Item = DiscoveryEvent> + Unpin + use<>`, `impl AddressLookup for MdnsAddressLookup`] [branch-review_19: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/address_lookup.rs:462-463,476-553 — `services: Arc<RwLock<Vec<Box<dyn AddressLookup>>>>`; the public methods are `set_addr_filter`, `add`, `add_boxed`, `is_empty`, `len`, `clear` and `resolve`, with no typed getter]

`MdnsAddressLookup` derives `Clone` and implements `AddressLookup`. `MdnsAddressLookup::builder().build(endpoint_id)` constructs it directly (requires a running tokio runtime; panics outside one). `endpoint.address_lookup()?.add(service)` attaches it after bind — required when a handle must be kept, because `AddressLookupServices` stores services as `Box<dyn AddressLookup>` with no typed getter. `subscribe().await` returns `impl Stream<Item = DiscoveryEvent> + Unpin`; `DiscoveryEvent` is `Discovered { endpoint_info: EndpointInfo, last_updated: Option<u64> }` or `Expired { endpoint_id: EndpointId }` (non_exhaustive).

## EndpointInfo carries endpoint_id and converts into a dialable EndpointAddr

**Verified at:** iroh 1.2.0 (iroh-dns 1.3.0), read 2026-09-21
**Citation:** [branch-review_20: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-dns-1.3.0/src/endpoint_info.rs:357-359,364,417 — `pub struct EndpointInfo { pub endpoint_id: EndpointId,`, `impl From<EndpointInfo> for EndpointAddr`, `pub fn into_endpoint_addr(self) -> EndpointAddr`] [branch-review_21: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:1060-1064 — `pub async fn connect(&self, endpoint_addr: impl Into<EndpointAddr>, alpn: &[u8])`; src/lib.rs:291 — `pub use iroh_dns::endpoint_info;`]

`EndpointInfo` has a public `endpoint_id` field and converts to `EndpointAddr` via `From`/`into_endpoint_addr()`; `Endpoint::connect(impl Into<EndpointAddr>, alpn: &[u8])` accepts it directly.

## Upstream iroh-mdns-address-lookup 0.4.0 joins multicast only on the default-route interface; the vendored copy this project builds joins it on every operational interface

**Verified at:** swarm-discovery 0.6.3, iroh-mdns-address-lookup 0.4.0 vendored, read 2026-09-21
**Citation:** [implementer_7: swarm-discovery-0.6.3/src/socket.rs:100-160 — `socket_v4(None)` joins 224.0.0.251 on `Ipv4Addr::UNSPECIFIED` (kernel default route interface); upstream iroh-mdns-address-lookup-0.4.0/src/lib.rs:472-509 — `spawn_discoverer` never calls `with_multicast_interfaces_v4` or `add_interface_v4`, so no per-interface sockets or group joins exist] [branch-review_22: app/src-tauri/vendor/iroh-mdns-address-lookup/src/lib.rs:254,257-263,509-512 — `pub const MULTICAST_INTERFACE_PATCH_ACTIVE: bool = true;`, `operational_multicast_interfaces_v4()` collecting the IPv4 addresses of every interface with `interface.is_up() && !interface.is_loopback()`, `.with_multicast_interfaces_v4(operational_multicast_interfaces_v4())` on the `Discoverer`] [branch-review_23: app/src-tauri/Cargo.toml:35-36 — `[patch.crates-io]` / `iroh-mdns-address-lookup = { path = "vendor/iroh-mdns-address-lookup" }`]

With no explicit interface list, the discoverer sends and receives multicast solely on the interface the OS picks for 224.0.0.0/4 — on Windows by lowest interface metric, so a VPN adapter (NordLynx, metric 5 vs. Wi-Fi 35) captures it even while the VPN session is disconnected, and discovery is silently dead in both directions while init succeeds. The copy this project builds is the vendored, patched one, which passes every up, non-loopback IPv4 interface to `with_multicast_interfaces_v4` (the entry on that method below), and `connectivity/connections.rs` asserts on `MULTICAST_INTERFACE_PATCH_ACTIVE` so a build that resolves past the patch fails instead of silently regressing.

## iroh-mdns-address-lookup emits `Discovered` repeatedly for the same peer, not once

**Verified at:** iroh-mdns-address-lookup 0.4.0 vendored, swarm-discovery 0.6.3, read 2026-09-21; observed 2026-07-22 at iroh 1.0.2
**Citation:** [implementer_11: ran `npm run dev` with an eprintln on every `DiscoveryEvent` in `connectivity/connections.rs::run_discovery` — observed 10+ consecutive `Discovered` events for the same peer id within one session, no intervening `Expired`] [branch-review_24: app/src-tauri/vendor/iroh-mdns-address-lookup/src/lib.rs:386-392,414-418 — the republish is suppressed only when `entry.get() == &peer_info`, otherwise `subscribers.send(DiscoveryEvent::Discovered {…})`] [branch-review_25: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/swarm-discovery-0.6.3/src/lib.rs:111-126 — `#[derive(Clone, Debug, PartialEq, Eq, …)] pub struct Peer { addrs, last_seen: Instant, txt }`, constructed with `last_seen: Instant::now()`]

The same peer id is re-delivered repeatedly while the discovery loop runs: the crate suppresses a republish only for a `Peer` equal to the stored one, and `Peer`'s derived `PartialEq` covers `last_seen`, which every fresh announcement sets to `Instant::now()` (one step not traced in source: that swarm-discovery constructs a new `Peer` per received packet).

Consequences: any handler reached from `handle_discovered` must be idempotent, since it is invoked many times per peer (`maybe_dial_trusted_peer` and `maybe_probe_candidate` both guard on `connections`/`dialing` and `probing`/`candidates`, so both are safe). Conversely, never diagnose a peer's failure to (re)connect as "the second discovery event never arrives" — that premise is false, and a repeated `Discovered` means the failure lies downstream in the dial or accept path.

## iroh Connection is a cheap Clone handle and close() is synchronous

**Verified at:** iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_26: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/connection.rs:745-747,969 — "May be cloned to obtain another handle to the same connection.", `#[derive(Debug, Clone)] pub struct Connection<State: ConnectionState = HandshakeCompleted>`, `pub fn close(&self, error_code: VarInt, reason: &[u8])` — takes `&self`, not async]

A `Connection` can be cloned to store one handle (e.g. in a state map) while another drives the read/write loop; both refer to the same underlying connection. `close()` is a synchronous `&self` method that signals QUIC to send CONNECTION_CLOSE and returns immediately, so it is safe to call while holding a `Mutex` guard. This enables deterministic connection dedup: on a simultaneous-open conflict, the losing connection's stored clone can be closed in-place under the lock.

## iroh connections idle out after 30s by default; a dead peer is not detected sooner without a graceful close

**Verified at:** iroh 1.2.0 (noq-proto 1.3.0), read 2026-09-21
**Citation:** [branch-review_27: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/quic.rs:153-162,189-190,211 — `QuicTransportConfigBuilder::new` sets `keep_alive_interval`, `default_path_keep_alive_interval`, `default_path_max_idle_timeout`, `max_concurrent_multipath_paths`, `max_remote_nat_traversal_addresses` and `server_handshake_migration`, never `max_idle_timeout`; "`None` represents an infinite timeout. Defaults to 30 seconds."; `pub fn max_idle_timeout(mut self, value: Option<IdleTimeout>)`] [branch-review_28: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-proto-1.3.0/src/config/transport.rs:559-560 — "30 second default recommended by RFC 9308 § 3.2" / `max_idle_timeout: Some(VarInt(30_000))`] [branch-review_29: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/socket.rs:109,117 — `HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5)`, `PATH_MAX_IDLE_TIMEOUT: Duration = Duration::from_secs(15)`] [branch-review_30: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:676,1719 — `pub fn transport_config(mut self, transport_config: QuicTransportConfig)`, `pub async fn close(&self)`]

A peer whose process exits without sending CONNECTION_CLOSE stays in the local live-connection set until the ~30s connection idle timeout expires, so any UI derived from that set shows the peer as connected for up to 30s. Override with `Endpoint::builder(..).transport_config(QuicTransportConfig::builder().max_idle_timeout(..).build())`, and/or call `Endpoint::close()` on app shutdown so peers are notified immediately.

## iroh requires at least one ALPN protocol identifier when accepting connections

**Verified at:** iroh 1.2.0, read 2026-09-21
**Citation:** [branch-review_31: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint.rs:538-539 — "to accept incoming connections at least one [ALPN] must be set."] [branch-review_32: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/lib.rs:215 — "To accept connections at least one ALPN must be configured."]

When accepting connections at least one ALPN must be configured (e.g. `alpns(vec![b"hello-world".to_vec()])`); ALPN is used by both sides to agree on the application-specific protocol running over the QUIC connection. The requirement is stated in the builder's documentation; no emptiness check was found in `bind`, so an endpoint bound without an ALPN does not fail at bind time.

## swarm-discovery binds both mDNS sockets successfully but sends and receives multicast only on the interface Windows picks, which a Hyper-V/WSL vEthernet adapter captures regardless of interface metric

**Verified at:** swarm-discovery 0.6.3 (via iroh-mdns-address-lookup 0.4.0), Windows 11
**Citation:** [claude_1: swarm-discovery-0.6.3/src/socket.rs:100-170 — `socket_v4(None)` binds `0.0.0.0:5353`, joins `224.0.0.251` with `interface_addr.unwrap_or(Ipv4Addr::UNSPECIFIED)`, and calls `set_multicast_if_v4` only `if let Some(addr) = interface_addr`, so with `None` both the group join and multicast egress are left to the OS; socket.rs:271-282 — `IpClass::Auto` keeps whichever of v4/v6 binds] [claude_2: ran a debug build with a `tracing_subscriber` installed and `swarm_discovery=trace` 2026-08-23 — observed `created new sockets sockets=Sockets { v4: Some(UdpSocket { addr: 0.0.0.0:5353 }), v6: Some(UdpSocket { addr: [::]:5353 }) }`, then all 167 subsequent packets to and from `172.22.48.1:5353` (the `vEthernet (WSL (Hyper-V firewall))` adapter) and the only endpoint id ever seen being the process's own]

Both sockets bind; the failure is interface selection, not binding. On a host with a Hyper-V/WSL virtual switch the app talks mDNS exclusively to itself on the virtual adapter and never reaches the LAN, so no peer is ever discovered. Interface metric does not correct it: this was observed with Wi-Fi at `InterfaceMetric` 1 and `vEthernet (WSL (Hyper-V firewall))` at 5000, both carrying a `224.0.0.0/4` route at `RouteMetric` 256 [claude_3: ran `Get-NetRoute -DestinationPrefix 224.0.0.0/4` and `Get-NetIPInterface -AddressFamily IPv4` — observed those values]. The NordVPN-era metric workaround therefore does not generalize to this adapter.

Neither `iroh-mdns-address-lookup` 0.4.0 nor 0.5.0 (the newest published version) exposes swarm-discovery's `Discoverer::with_multicast_interfaces_v4`, so no dependency bump fixes this [claude_4: https://crates.io/api/v1/crates/iroh-mdns-address-lookup — newest version 0.5.0; https://docs.rs/iroh-mdns-address-lookup/0.5.0/iroh_mdns_address_lookup/struct.MdnsAddressLookupBuilder.html — builder exposes only `advertise`, `service_name`, `addr_filter`, `build`]. Workarounds are host-side (disable the virtual adapter, or add a more-specific `224.0.0.251/32` route on the LAN interface) or a patched/vendored discovery crate.

## Passing every operational interface to swarm-discovery's with_multicast_interfaces_v4 restores LAN discovery on a multi-homed Windows host

**Verified at:** swarm-discovery 0.6.3, iroh-mdns-address-lookup 0.4.0 vendored and patched
**Citation:** [claude_1: swarm-discovery-0.6.3/src/lib.rs:369 — `pub fn with_multicast_interfaces_v4(mut self, interfaces: Vec<Ipv4Addr>) -> Self`; socket.rs:295-297 — `Sockets::new` then calls `join_group_on_main_v4(addr)` for every supplied address, joining the group per interface on the wildcard socket] [claude_2: ran the patched debug build 2026-08-23 — observed `Created interface-specific socket for 192.168.2.32`, `joined multicast group on interface 192.168.2.32`, and the peer endpoint id `7vpfcha…` discovered 1.5s after startup with 88 packets from 192.168.2.154, where the unpatched build had seen only its own id]

Windows selects the multicast interface for an `INADDR_ANY` join by neither interface metric, longest-prefix route, nor the interface's address — all three were changed with no effect, while a Hyper-V/WSL vEthernet adapter kept winning over Wi-Fi [claude_3: ran a wildcard-bind probe replicating `socket_v4(None)` after each change — source address stayed on the virtual adapter through `InterfaceMetric` 1 on Wi-Fi, an added `224.0.0.251/32` route on Wi-Fi at `RouteMetric` 1, and `Remove-NetIPAddress` on the virtual adapter, which Windows immediately replaced with an APIPA address on the same interface]. Windows also refuses `Disable-NetAdapter` and `Disable-NetAdapterBinding` on that adapter even when elevated. Supplying the interface list explicitly is therefore the only reliable fix, and enumerating every up, non-loopback interface avoids having to identify the correct one. A supplied address whose interface cannot join (an APIPA address) fails with os error 10022 at DEBUG level and is tolerated without affecting the others.

## `iroh::SecretKey::from_bytes(&[u8; 32]).public()` builds a deterministic `EndpointId` without networking

**Verified at:** iroh 1.2.0 (iroh-base 1.2.0)
**Citation:** [spec-writer_49: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/lib.rs:285-286 — `pub use iroh_base::{EndpointAddr, EndpointId, KeyParsingError, PublicKey, RelayUrl, RelayUrlParseError, SecretKey, …}`] [pairing_73: ran `cargo test --offline` on a scratch crate with iroh-base =1.2.0 — observed `SecretKey::from_bytes(&[1u8; 32]).public()` identical across runs and different from `[2u8; 32]`]

Unit tests can create distinct, stable endpoint ids from fixed byte arrays with no endpoint bound.

## iroh `Connection::stable_id()` stays fixed for the connection's lifetime and differs between connections open at the same time

**Verified at:** iroh 1.2.0 (noq 1.3.0)
**Citation:** [spec-writer_50: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/iroh-1.2.0/src/endpoint/connection.rs:1066-1074 — "A stable identifier for this connection. Peer addresses and connection IDs can change, but this value will remain fixed for the lifetime of the connection." `pub fn stable_id(&self) -> usize`, returning `self.inner.stable_id()`] [spec-writer_12: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/connection.rs:1393-1395 — `&*self.0 as *const _ as usize`]

The value is the address of the connection's shared state, so two connections alive at the same time never share it, while a closed connection's value can be reused by a later one. Comparing `stable_id()` values therefore tells whether two `Connection` handles are the same live connection, without holding a channel sender or any other resource.

## Dropping an iroh `SendStream` finishes it unless the connection has already errored or the stream is 0-RTT and its 0-RTT was not accepted

**Verified at:** iroh 1.2.0 (noq 1.3.0), 2026-09-19
**Citation:** [review_2: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/send_stream.rs:351-375 — Drop for SendStream returns early when conn.error.is_some() || (self.is_0rtt && conn.check_0rtt().is_err()), else calls finish(), resets on FinishError::Stopped and does nothing on FinishError::ClosedStream; iroh-1.2.0/src/endpoint.rs:90,98-118 — pub(crate) mod quic and pub use self::{ quic::{…, SendStream, …} }; iroh-1.2.0/src/endpoint/quic.rs:15-45 — pub use noq::{…, SendStream, …}] [implement_1: ~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/noq-1.3.0/src/connection.rs:1924-1933 — check_0rtt returns Err(()) only when the connection is no longer handshaking, has not accepted 0-RTT and is not the server side]

Dropping an `iroh::endpoint::SendStream` calls `finish()` on its stream, and resets the stream only when `finish()` reports that the peer had already stopped it. The drop does nothing further when the connection has already errored, or when the stream is 0-RTT and `check_0rtt()` fails, which it does once the handshake has finished on the client side without 0-RTT having been accepted.
