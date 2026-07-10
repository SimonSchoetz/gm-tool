# Spec: Device Pairing & P2P Connection Management

A GM pairs two GM Tool instances on the same LAN once, after which they auto-connect with end-to-end encryption whenever both run. Devices are managed (list, rename self, forget, live status) in a new Devices section on the Settings screen.

## Progress Tracker

- Sub-feature 1: Rust connectivity backend — iroh endpoint, identity, pairing protocol, commands, events ([SPEC_DEVICE_PAIRING_SF1.md](SPEC_DEVICE_PAIRING_SF1.md))
- Sub-feature 2: DB layer — `paired_devices` table + `_system` device identity accessor ([SPEC_DEVICE_PAIRING_SF2.md](SPEC_DEVICE_PAIRING_SF2.md))
- Sub-feature 3: Domain vocabulary — device errors, message envelope schemas, connectivity event contracts ([SPEC_DEVICE_PAIRING_SF3.md](SPEC_DEVICE_PAIRING_SF3.md))
- Sub-feature 4: devicesService — business logic composing DB, Tauri commands, and message semantics ([SPEC_DEVICE_PAIRING_SF4.md](SPEC_DEVICE_PAIRING_SF4.md))
- Sub-feature 5: Data access layer — devices hooks, connectivity lifecycle, DAL barrel cleanup ([SPEC_DEVICE_PAIRING_SF5.md](SPEC_DEVICE_PAIRING_SF5.md))
- Sub-feature 6: DevicesSection — Settings UI for own name, paired list, status dots, forget ([SPEC_DEVICE_PAIRING_SF6.md](SPEC_DEVICE_PAIRING_SF6.md))
- Sub-feature 7: PairDeviceDialog — modal pairing flow ([SPEC_DEVICE_PAIRING_SF7.md](SPEC_DEVICE_PAIRING_SF7.md))

Implementation order is SF1 → SF7. Each SF passes baseline checks (tsc, eslint, prettier — and clippy/fmt for SF1) when committed alone; there are no Foundation SFs. SF1 is Rust-only and independent of SF2–SF7 at the toolchain level; SF2 through SF7 each depend only on the SFs before them.

## Key Architectural Decisions

### Rust is a secure pipe; TypeScript owns message semantics and all persistence

The Rust backend (`src-tauri/src/connectivity/`) owns LAN discovery, cryptographic identity, the pairing handshake, transport encryption, and connection lifecycle. It treats application messages as opaque JSON strings and never touches SQLite. TypeScript owns the message envelope semantics (Zod-validated), all persistence, services, and UI. This keeps the DB layer conventions (`app/db/CLAUDE.md`), Zod validation, and the services error contract (`app/services/CLAUDE.md`) as the single home for domain logic.

### Networking stack: iroh 1.0.2 + iroh-mdns-address-lookup 0.4, LAN-only

Verified facts about iroh are recorded in `.claude/knowledge/iroh.md` — read it before touching SF1. Connections are QUIC, authenticated and E2E-encrypted to an Ed25519 key. The endpoint is built LAN-only: `relay_mode(RelayMode::Disabled)`, `clear_address_lookup()`, then only the mDNS address lookup added [S_1: https://docs.rs/iroh/latest/iroh/endpoint/struct.Builder.html]. Nothing is ever published to public DNS/relay infrastructure.

### Device identity: the device id IS the iroh EndpointId

A device's unique id is its iroh `EndpointId` (the public half of an Ed25519 keypair) in its 64-character lowercase hex `Display` encoding [S_3: https://docs.rs/iroh/latest/iroh/type.EndpointId.html]. There is no separate `public_key` column anywhere — trusting a device means persisting its id. The secret key is generated, stored, and used exclusively by Rust (file in the app data directory); it never crosses IPC.

### Own identity lives in `_system` under key `device`; peers live in the `paired_devices` table

The own device's `{ id, name }` is a singleton infrastructure value stored as a `_system` row (key `device`), following the existing `versioning` pattern (Zod schema in `db/_system/schema.ts`, typed accessor file). Peers are a collection and get a real table `paired_devices` with the standard CRUD module `db/paired-device/`. This was chosen over the `_settings` table deliberately: device identity is not a user preference, and the immutable id must not be writable through the generic settings update path.

### `paired_devices.id` is a caller-supplied EndpointId, not a nanoid — and the table has no `adventure_id`

Two deviations from the domain-scaffold base schema, both intentional: (1) `id` is the peer's cryptographic identity supplied at create time, validated as 64-char lowercase hex — `generateId()` is not used; (2) devices are global infrastructure shared across all Adventures, like `Image` — no `adventure_id` column. Devices do not participate in any adventure-scoped ambient system: no table_config row, no mention search, no navigation/breadcrumbs, no image support, no seed data.

### Versioned message envelope, opaque to Rust, forward-compatible by ignoring the unknown

Every application message is `{ v: number, type: string, payload: object }`, serialized as a JSON string. Rust relays these strings without parsing them. TypeScript validates with a Zod discriminated union. Initial types: `hello`, `name-update`, `unpair`. A message that fails envelope validation (unknown type, future version) is silently ignored — this is the deliberate forward-compatibility contract that lets a future sync story add message types without breaking old clients. Only the `v` field is reserved for that future; nothing else anticipates sync.

### Dual ALPN: `gm-tool` for trusted traffic, `gm-tool-pairing` for pairing

The endpoint accepts two ALPN protocols [S_4 in .claude/knowledge/iroh.md: alpns() takes a Vec]. Connections on `gm-tool` are accepted only from EndpointIds in the trusted set — all others are closed immediately. Connections on `gm-tool-pairing` are accepted only while pairing mode is active. This makes "unpaired device on the LAN" structurally unable to exchange application messages.

### Pairing trust model: 6-digit code proves screen visibility

Pairing mode (entered by opening the pairing dialog) makes the device accept `gm-tool-pairing` connections and probe discovered unpaired endpoints with an identity exchange (`{ id, name }` both directions) so each side can list candidates by name. Trust is established when the user types the 6-digit code displayed on the other device; the receiving side verifies it against its own displayed code. 3 failed attempts close that candidate's pairing connection. The code proves the user can see the other device's screen. Residual risk — a hostile LAN actor relaying between two devices simultaneously in pairing mode — is accepted: the threat model is a home LAN, the pairing window is bounded by the dialog being open, and a wrong pairing is immediately visible in the device list and can be forgotten. Device names are exchanged over the pairing connection, not via mDNS user data (no verified API for mDNS user data exists in iroh-mdns-address-lookup 0.4).

### Connection deduplication: the lexicographically smaller hex id dials

After pairing (and on every discovery of a trusted peer), both sides could dial simultaneously. The rule: the device whose EndpointId hex string is lexicographically smaller initiates the `gm-tool` connection; the other side only accepts. This is a protocol invariant both SF1 code paths must implement.

### Unpair is reciprocal and best-effort

Forgetting a device: send an `unpair` envelope if connected (failures swallowed — the peer may be offline), drop trust in Rust, delete the local row. A device receiving `unpair` removes its own row and trust for the sender — full mutual forget. An offline peer that was forgotten simply fails authentication on its next connect attempt and keeps a stale row until its user forgets too. No stronger guarantee exists; do not invent one.

### Connection status is runtime-only

Green/grey status never touches SQLite. Rust holds the live connection set; the frontend seeds it via the `get_connected_peers` command into a TanStack Query cache entry and updates it via `setQueryData` from Tauri events. Rename events and hello exchanges update the persisted name; connect/disconnect events update only the runtime cache.

### Connectivity init and pairing-code submission handle errors locally, not via the Error Boundary

Two sanctioned deviations from the global `throwOnError` defaults, both mirroring the documented non-blocking background check exception (`app/src/CLAUDE.md` — State Management, `useUpdater` precedent): (1) the init query omits `throwOnError` — a firewall-blocked startup must not crash the app; its failure surfaces as degraded mode (grey dots, pairing attempts fail inline) rather than through an exposed error field, because the lifecycle hook must never gain a second mount just to read state; (2) the pairing-code submit mutation sets `throwOnError: false` with a block comment and exposes its error as a typed field the dialog renders inline. Each deviation carries a block comment at the call site.

### `init_connectivity` is idempotent

`main.tsx` renders in `React.StrictMode`, so mount effects double-fire in dev. The Rust command returns the existing endpoint's id when already initialized instead of re-binding. The frontend init also runs through `useQuery` (not a bare effect), which deduplicates concurrent calls.

### Rename is conflict-free by construction

Only a device writes its own name (`_system` + broadcast). Peers persist received names into `paired_devices.name`. No conflict handling exists anywhere because two writers for the same name field are impossible.

### camelCase-to-snake_case invoke argument mapping is the established pattern

TS invoke calls pass camelCase keys for snake_case Rust parameters — established by the existing updater integration [S_5: app/services/updaterService.ts:35 — `invoke('download_update', { onEvent: ... })` maps to Rust `on_event`, working in production].

## CLAUDE.md Impact

- `app/src-tauri/CLAUDE.md` — the Structure section's directory tree must add `connectivity/` (long-lived networking core: state, identity, pairing, connections) as a new top-level module beside `commands/`, and the Commands Structure section must note that `commands/connectivity/` files are thin wrappers delegating to `connectivity/`. Add the new commands to the command documentation list following the existing per-command format. Add `iroh`, `iroh-mdns-address-lookup`, and `rand` to the Dependencies list.
- `app/db/CLAUDE.md` — the Structure tree lists `_system/` with `versioning.ts` as its only typed accessor; add `device.ts # Typed accessors for the device key (public API)`.
- `app/docs/_product/domain-scaffold.md` — no update: `paired_devices` is deliberately not a standard domain entity (no adventure scoping, no screens, no table config), so the scaffold does not apply to it and gains nothing from it.
- Root `CLAUDE.md` — no update: the Domain Glossary covers narrative entities and Table Config; if the user wants Devices listed there, that is a `/refine-claude` decision, not part of this implementation.
