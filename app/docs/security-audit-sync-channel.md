# Security Audit — LAN Sync Channel and Database Exposure

Audit date: 2026-08-31. Repository state: `ae1385c89aaa4b6a4bbc0e45eef188eb5326da24` (`main`, tag `v0.14.1`). Audit branch: `docs/security-audit-sync-channel`.

This document is a findings record, not a spec. It carries no progress tracker and no layered breakdown, and is not governed by the spec format in `app/docs/CLAUDE.md`. It is a working document: delete it once every finding below is either fixed or explicitly accepted.

## Question this audit answers

Whether the application's SQLite database can be compromised — read beyond its intended surface, corrupted, or used as a vector for arbitrary code or filesystem access — by an attacker, and through which paths.

## Method and limits

Every finding below was established by reading source. **No exploit was executed against a running instance.** Each finding therefore states its exploitation chain link by link with a citation per link, so a follow-up agent can either build a proof-of-concept or falsify the chain. The severity labels assume the trust model described in the next section holds; if that model is wrong, the severities are wrong.

Areas read: `app/db/` (all CRUD, query builders, migrations, sync layer), `app/services/`, `app/domain/sync/`, `app/domain/entities/`, `app/src-tauri/src/connectivity/`, `app/src-tauri/src/commands/images/`, `app/src-tauri/tauri.conf.json`, `app/src-tauri/capabilities/default.json`.

Areas **not** covered, and still open: the updater command surface (`app/src-tauri/src/commands/updater/`) and its signature verification; the Lexical editor node deserialization path; dependency supply-chain review (`pnpm audit`, `cargo audit`); the `_settings` and `_system` write paths beyond the two accessors read.

## Trust model — what the attacker must already have

Understanding this is a prerequisite for reading the findings, because every finding except Finding 4 requires network adjacency plus one of two positions.

The transport is iroh QUIC over LAN only. Relays are disabled and there is no DNS/pkarr publishing, so mDNS is the sole address lookup and nothing here is reachable from the internet [security-audit_1: `app/src-tauri/src/connectivity/connections.rs:67` — `.relay_mode(RelayMode::Disabled)` with `.clear_address_lookup()` on the adjacent builder lines].

Two ALPNs are served [security-audit_2: `app/src-tauri/src/connectivity/connections.rs:70` — `.alpns(vec![ALPN_MAIN.to_vec(), ALPN_PAIRING.to_vec()])`]:

- `ALPN_MAIN` — the sync channel. An incoming connection is refused unless the remote endpoint id is in the trusted set [security-audit_3: `app/src-tauri/src/connectivity/connections.rs:165-168` — `if connection.alpn() == ALPN_MAIN { let is_trusted = ...; if !is_trusted { connection.close(...); return; } }`]. An iroh endpoint id **is** the remote's TLS public key, so this identity is not spoofable by an attacker who lacks the corresponding secret key.
- `ALPN_PAIRING` — accepted from anyone, but only while a pairing session is live, i.e. while the user has the pairing dialog open [security-audit_4: `app/src-tauri/src/connectivity/connections.rs:173-176` — `let pairing_active = state.lock().await.pairing.is_some(); if !pairing_active { connection.close(...); return; }`].

So the attacker positions are: **(A) an already-paired device** — a peer the user deliberately trusted, or a device that peer has been compromised on; and **(B) a LAN-adjacent device during an open pairing window**, which Finding 3 shows can be escalated into position (A).

Position (A) is not a "trusted therefore harmless" party for the purposes of this audit. A paired device is authorised to sync rows. It is not authorised to execute SQL of its choosing, read arbitrary files, or write arbitrary files. Findings 1 and 2 are precisely the gap between those two things.

## Finding 1 — Arbitrary SQL execution via synced `table_config` reaching mention search (Critical)

A peer in position (A) can execute arbitrary SQL against the local database, including `DROP`, `UPDATE`, and `ATTACH DATABASE`.

### Chain

1. `table_config` is a synced table, so a peer may push rows for it [security-audit_5: `app/db/_sync/registry.ts:39` — `name: 'table_config'` within the `SYNCED_TABLES` array].
2. The incoming `table_config` row's `table_name` is validated only as a non-empty string before being written — there is no allowlist check [security-audit_6: `app/db/_sync/apply-upsert.ts:60-61` — `const tableName = filtered.table_name; if (typeof tableName !== 'string' || tableName === '') return 'skipped';`]. The Zod column schema is likewise an unconstrained `z.string()` [security-audit_7: `app/db/table-config/schema.ts` — the `table_name` column declares `zod: z.string()` with no `.regex` or `.refine`]. Note also that `applyUpsert` uses each table's `zodSchema` only as a **source of column names**, never to parse incoming values, so no value-level validation happens anywhere on this path.
3. `searchMentions` reads every `table_config` row with `tagging_enabled === 1` and passes its `table_name` straight to the DB layer, with no `isEntityType` guard [security-audit_8: `app/services/mentionSearchService.ts:21` — `tableConfigs.filter((c) => c.tagging_enabled === 1)`; `app/services/mentionSearchService.ts:26` — `config.table_name` passed as the first argument to `mentionSearch.searchByName`]. The attacker controls `tagging_enabled` too, since it is a column on the same synced row.
4. The DB layer interpolates that value directly into the SQL string [security-audit_9: `app/db/mention-search.ts:19` — ``SELECT id, name, updated_at FROM ${tableName} WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC``; the `adventureId === null` branch at `app/db/mention-search.ts:25` has the same shape].
5. The trigger is any user typing `@` into any text editor in the app [security-audit_10: `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx:36` — `.searchMentions(matchingString, adventureId, tableConfigs)` inside `onQueryChange`].

### Why this is arbitrary SQL and not merely a wider `SELECT`

The SQLite driver executes multiple `;`-separated top-level statements from a single query string, distributing bind parameters across them in order [security-audit_11: `.claude/knowledge/sqlite.md:45-48` — recorded knowledge-base entry "sqlx-sqlite supports multiple `;`-separated top-level statements in a single query string passed to one execute()/select() call", verified at sqlx-sqlite 0.8.6 on 2026-08-27, citing `sqlx-sqlite-0.8.6/src/connection/execute.rs:8-19` and `sqlx-sqlite-0.8.6/src/migrate.rs:145`].

A `table_name` value of the following form therefore yields three statements, with `$1` and `$2` binding harmlessly to the third:

```text
npcs; DROP TABLE adventures; SELECT id,name,updated_at FROM npcs
```

### The invariant that broke

`app/db/mention-search.ts:16` carries the comment asserting that `tableName` "must only ever receive values from `table_config.table_name`, which is seeded by the application itself — never from user input." That was true before `table_config` became a synced table. **It is now false**, and the comment must be corrected as part of any fix rather than left asserting a guarantee the code no longer has.

The sibling function in the same file is not vulnerable: `getById` is called only through `getMentionEntityData`, which does gate on the entity-type allowlist [security-audit_12: `app/services/mentionSearchService.ts:64` — `if (!isEntityType(entityType)) { return { name: null, deleted: true }; }`]. That function is the correct model for the fix.

### Recommended fix

Both halves, not either one:

- In `applyTableConfigUpsert` (`app/db/_sync/apply-upsert.ts`), reject any incoming `table_name` not in the canonical entity-type list, so poisoned rows never land.
- In `searchMentions` (`app/services/mentionSearchService.ts`), gate each config on `isEntityType(config.table_name)` before calling `searchByName`, mirroring `getMentionEntityData`. This restores the invariant `app/db/mention-search.ts:16` claims, and defends against any other future writer of that column.

Then update the comment at `app/db/mention-search.ts:16` to describe the guarantee that actually exists.

## Finding 2 — Peer-controlled path traversal in image file transfer (High)

A peer in position (A) can read and write files anywhere on the filesystem that the app process can reach, constrained to paths ending in an image extension.

### Chain

1. `imageId` arrives from the peer as an unconstrained string on both file-transfer message types [security-audit_13: `app/domain/sync/messages.ts:44` — `payload: z.object({ imageId: z.string(), extension: z.string() })` for `file-request`; `app/domain/sync/messages.ts:50` — `imageId: z.string()` for `file-chunk`].
2. It is forwarded unmodified into the Tauri commands [security-audit_14: `app/services/syncService.ts:232-234` — `invoke<string>('read_image_bytes', { id: payload.imageId, extension: payload.extension })`; `app/services/syncService.ts:279-282` — `invoke('save_image_bytes', { id: payload.imageId, extension: existing.extension, ... })`].
3. Every image command interpolates `id` into a path with no validation and no normalization [security-audit_15: `app/src-tauri/src/commands/images/read_image_bytes.rs:35` and `app/src-tauri/src/commands/images/save_image_bytes.rs:39` — both `images_dir.join(format!("{}.{}", id, extension))`; the identical pattern appears at `delete_image.rs:29`, `get_image_url.rs:28`, `image_file_exists.rs:32`, `save_image.rs:42`]. Rust's `PathBuf::join` does not resolve `..`; the OS resolves it at open time.

Consequently an `imageId` of `../../../../Users/<name>/Pictures/private` produces a read of, or a write to, that path.

### What limits it

`extension` **is** allowlisted in five of the six commands [security-audit_16: `app/src-tauri/src/commands/images/mod.rs` — `pub(crate) const VALID_EXTENSIONS: [&str; 5] = ["jpg", "jpeg", "png", "webp", "gif"];`, checked at the top of `read_image_bytes.rs`, `save_image_bytes.rs`, `save_image.rs`, `image_file_exists.rs`]. Because the extension is always appended, the constructed path always ends in one of those five suffixes, so `gm_tool.db` itself cannot be read or overwritten through this path directly. The exposure is arbitrary read and write of image-suffixed paths.

`delete_image` and `get_image_url` perform **no** extension check at all [security-audit_17: `app/src-tauri/src/commands/images/delete_image.rs` and `app/src-tauri/src/commands/images/get_image_url.rs` — neither file references `VALID_EXTENSIONS`]. Neither is reachable from a peer message today; both are reachable from the webview.

### Recommended fix

Validate `id` in the **Rust** commands, not only in the Zod schema. The Rust layer is the real trust boundary, because the TypeScript side is equally reachable from a compromised webview (see Finding 4). The generator is nanoid at its default size over the URL-safe alphabet [security-audit_18: `app/db/util/generate-id.ts` — `generateId` returns `nanoid()` with no size argument; `app/node_modules/nanoid/index.js:54` — `let nanoid = (size = 21) => {`; `app/node_modules/nanoid/url-alphabet/index.js:1-2` — alphabet `'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'`, i.e. `A-Za-z0-9_-`; nanoid 3.3.18], so a `^[A-Za-z0-9_-]{21}$` shape check rejects every traversal sequence. Tighten `imageId` in `app/domain/sync/messages.ts` in the same pass, and add the missing `VALID_EXTENSIONS` check to `delete_image` and `get_image_url` for consistency.

## Finding 3 — Pairing code brute-forceable by reconnecting (Medium)

An attacker in position (B) can escalate to position (A) without knowing the pairing code.

The failure counter is stored per candidate, and the candidate is discarded along with the connection once the limit is hit [security-audit_19: `app/src-tauri/src/connectivity/pairing.rs:18` — `const MAX_CODE_FAILURES: u8 = 3;`; `app/src-tauri/src/connectivity/pairing.rs:325` — `if failures >= MAX_CODE_FAILURES { session.candidates.remove(&remote); ... break 'connection; }`]. Nothing records the offending endpoint id, so the attacker simply reconnects: the next `PairingHello` inserts a fresh candidate with the counter reset [security-audit_20: `app/src-tauri/src/connectivity/pairing.rs:279-282` — `session.candidates.insert(remote, PairingCandidate { frame_sender: sender, pending_verdict: None, failures: 0 });`].

Three guesses per connection against a 6-digit space, with unlimited connections over LAN QUIC, is tractable. The code itself is fine — it is drawn from the `rand` crate's CSPRNG and rotates per session [security-audit_21: `app/src-tauri/src/connectivity/pairing.rs:67` — `let code = format!("{:06}", rand::random_range(0..=999_999u32));`]. The weakness is solely the reset.

Mitigating factor: the window is only as long as the user leaves the pairing dialog open, and a successful pair emits a visible `EVENT_PAIRING_SUCCEEDED` the user would likely notice.

**Recommended fix:** hold failures per `EndpointId` on the `PairingSession` rather than on the per-connection `PairingCandidate`, so the count survives a reconnect for the life of the session.

## Finding 4 — Defense-in-depth gaps (Low)

None of these is independently exploitable given the current code. Each removes a layer that is currently doing real work by accident rather than by design.

- **No Content Security Policy.** `"csp": null` [security-audit_22: `app/src-tauri/tauri.conf.json:23`]. The webview holds `sql:allow-execute` and `sql:allow-select` [security-audit_23: `app/src-tauri/capabilities/default.json` — `permissions` includes `"sql:allow-execute"`, `"sql:allow-select"`, `"sql:allow-load"`], so any script execution inside the webview is unrestricted database access. A grep for HTML-injection sinks found none in application code [security-audit_24: `grep -rn 'dangerouslySetInnerHTML|innerHTML|$generateNodesFromDOM' app/src` — the only non-test hit is `app/src/main.tsx:40`, an emptiness check on the root element, not an assignment of untrusted content]. There is therefore no live XSS today; a CSP is what keeps a future one from becoming full DB compromise.
- **Asset protocol scoped to the entire filesystem.** `"scope": ["**"]` [security-audit_25: `app/src-tauri/tauri.conf.json:24-26`]. Scoping this to the app data directory costs nothing and bounds Finding 2's read half.
- **Device secret key written with default permissions.** The endpoint secret key is persisted with a plain `fs::write` and no explicit mode, so it inherits the process umask [security-audit_26: `app/src-tauri/src/connectivity/identity.rs:24` — `fs::write(&key_path, encode_hex_key(&secret_key.to_bytes()))`]. This file is the device's network identity; `0600` is appropriate.
- **Sync row values are never schema-validated.** As noted in Finding 1 step 2, `applyUpsert` consults `zodSchema` for column names only. Values are bound as parameters, so this is not injectable, but a peer can write type-violating data into any synced column.

## Verified clean

Recording these so a follow-up agent does not re-audit them:

- **All local CRUD is parameterized.** A sweep for template-literal and concatenated SQL across `app/db/` and `app/services/` found no dynamic value interpolation — every value travels as a bind parameter [security-audit_27: ran a grep over `app/db` and `app/services` for `execute(` / `select(` calls opening with a template literal — hits are migration DDL, `app/db/pinned-order.ts:30`, and `app/db/_sync/apply-delete.ts:47`, all of which interpolate a table name only; a second grep for SQL keywords adjacent to a string-concatenation operator returned no matches].
- **The query builders are safe.** `buildCreateQuery` and `buildUpdateQuery` interpolate only a hardcoded table name supplied by the calling domain module, plus column keys taken from an already-Zod-parsed object [security-audit_28: `app/db/util/build-create-query.ts` and `app/db/util/build-update-query.ts` — both push `$N` placeholders for every value and never interpolate one].
- **Three of the four raw table-name interpolations are correctly gated.** `applyDelete` and `getRowById` check `SYNCED_TABLE_NAMES` before interpolating [security-audit_29: `app/db/_sync/apply-delete.ts:32` — `if (!SYNCED_TABLE_NAMES.includes(tableName)) return 'skipped';`; `app/db/_sync/get-row-by-id.ts` — `if (!SYNCED_TABLE_NAMES.includes(tableName)) { throw ... }`], and both `pinned-order.ts` entry points are gated by `isEntityType` at the service layer [security-audit_30: `app/services/pinnedOrderService.ts` — `if (!isEntityType(entityType)) { throw pinnedOrderError(...); }` in both `pinEntity` and `unpinEntity`]. `mention-search.searchByName` is the sole ungated one.
- **The `_system` and `_settings` accessors are parameterized** [security-audit_31: `app/db/_system/get.ts`, `app/db/_system/update.ts`, `app/db/_settings/get.ts` — all three bind `key` as `$1`].
- **Endpoint identity is not spoofable**, per the trust model section above.

## Recommended fix order

1. **Finding 1** — highest impact, smallest change, and it closes the only arbitrary-SQL path.
2. **Finding 2** — same attacker position, comparably small.
3. **Finding 3** — independent of the other two; touches only Rust.
4. **Finding 4** — the CSP change carries the highest regression risk of anything here and should be verified against a running app rather than committed blind.

Findings 1 and 2 are both reachable from an already-paired device and are the natural first branch.

Each fix needs test coverage in the corresponding `__tests__/` directory per `app/db/CLAUDE.md` — in particular `app/db/_sync/__tests__/apply-upsert.test.ts` for the Finding 1 sync-side guard, and a new service-layer assertion for the `searchMentions` guard.
