# Spec: Security Hardening — LAN Sync Channel and Database Exposure

## Progress tracker

- Sub-feature 1: Mention-search injection guard — stop a synced `table_config` row from reaching raw SQL interpolation
- Sub-feature 2: Image id path-traversal guard — stop a peer- or webview-supplied `imageId` from escaping the images directory
- Sub-feature 3: Pairing failure counter per endpoint — stop a reconnect from resetting the 3-attempt code limit
- Sub-feature 4: Defense-in-depth — narrow the asset-protocol scope, restrict device-key file permissions, validate incoming sync row values
- Sub-feature 5: Content Security Policy — replace `csp: null` with a real policy, verified against a running app
- Sub-feature 6: Audit retirement — delete the completed audit record and hand off the areas it never covered

No sub-feature is a Foundation SF. Sub-features 1 and 4 both modify `app/db/_sync/apply-upsert.ts`, but each leaves the file complete and buildable on its own; neither introduces an export the other consumes.

## Key Architectural Decisions

### The load-bearing table-name guard lives at the SQL interpolation site, not in the service layer

`app/db/mention-search.ts` builds its query by interpolating `tableName` into the SQL string, because SQL does not support a parameterized table name. That makes the function itself the trust boundary, and the guard belongs in it. Placing the only guard in `app/services/mentionSearchService.ts` would leave the boundary dependent on every present and future caller remembering to validate first, and `app/services/` has no test files anywhere in the repository, so a guard placed there would ship with no automated coverage. `app/db/__tests__/mention-search.test.ts` already exists and `app/db/CLAUDE.md` — Testing establishes the pattern. The service keeps a matching filter, but purely as an early-out that avoids issuing a query per non-entity config on every keystroke; it is not the boundary and says so in a comment.

### `table_config.table_name` validates against `SYNCED_TABLE_NAMES`, not the entity-type list

`table_config` is infrastructure, not a domain entity, and its rows key on real table names. The two sibling functions in the same directory that interpolate a table name — `applyDelete` in `app/db/_sync/apply-delete.ts` and `getRowById` in `app/db/_sync/get-row-by-id.ts` — both gate on `SYNCED_TABLE_NAMES`, and `applyTableConfigUpsert` is the third member of that set. Gating it on `ENTITY_TYPES` instead would work only by coincidence: every `table_config` row seeded today happens to name a table that is also an entity type, so the two lists overlap for current data while being owned by different concerns. `ENTITY_TYPES` is owned by mention and navigation display; the day a `table_config` row exists for a non-entity table, an `ENTITY_TYPES` gate would silently stop syncing it. The mention-search guard in the same sub-feature does use `isEntityType`, because there the question genuinely is "is this a table a mention can point at."

### Image id validation is a character-class check with no length constraint

Image ids are produced by `generateId()` in `app/db/util/generate-id.ts`, which returns `nanoid()` with no size argument. nanoid's URL-safe alphabet is `A-Za-z0-9_-`. A string drawn only from that class contains no path separator, no `.`, no NUL and no whitespace, so it cannot traverse out of the images directory regardless of its length. Pinning the length to nanoid's current default would add no traversal defense and would make every stored image whose id is not exactly that length unreadable — an unverified assumption about historical data, taken for no security benefit. The check is therefore non-empty plus character class only.

### Image id validation is duplicated across the Rust/TypeScript boundary by design

The Rust command is the real trust boundary, because the TypeScript side is equally reachable from a compromised webview. The Zod constraint in `app/domain/sync/messages.ts` exists so a malformed peer message is rejected at the message edge rather than at the `invoke` call, and is not a substitute for the Rust check. The two cannot share a definition across the runtime boundary. This is the same split the codebase already accepts for endpoint ids: `ENDPOINT_ID_HEX_REGEX` in `app/domain/devices/identity.ts` and the hand-rolled hex-and-length check in `decode_hex_key` in `app/src-tauri/src/connectivity/identity.rs`. It is not a missed DRY extraction, and the code carries a comment saying so at both sites.

### Pairing failure counts live on the session, keyed by endpoint id

The current counter is a field on `PairingCandidate`, and a candidate is created fresh on every `PairingHello` and destroyed with its connection. An attacker who exhausts three attempts simply reconnects into a zeroed counter. Moving the count to a `HashMap<EndpointId, u8>` on `PairingSession` makes it survive reconnects for the life of the session, which is the intended scope — the session ends when the user closes the pairing dialog, and the code rotates with it. The `PairingCandidate.failures` field has no remaining reader once this lands and is removed in the same change: `cargo clippy -- -D warnings` fails on the dead field, and root CLAUDE.md's re-derive-types-after-refactor rule requires its removal independently.

### Incoming sync rows are validated with a partial schema parse

`app/db/CLAUDE.md` states that `zodSchema` "is used only as a TypeScript type-inference source ... it is never runtime-parsed against a read row anywhere in this codebase." That statement stays true: a row arriving from a peer over the network is untrusted input, not a row read back from this database, and the two have opposite trust properties. The parse uses `.partial()` rather than the schema as authored, because a peer running an older or newer schema version legitimately sends a row missing columns this device knows about — requiring every key would drop valid rows on version drift, which is a data-loss bug, while a present key carrying the wrong type is exactly the defect this catches. A row that fails the parse is skipped, matching the existing `executeUpsert` catch-and-skip posture for a constraint failure. This catches type-level violations only: `table_config.layout` is declared `z.string()` and `tagging_enabled` is a bare `z.number()` on `zodSchema`, so `tagging_enabled: 7` and a `layout` string holding malformed JSON both still pass. Semantic validation is out of scope.

### Storing the schema on the registry entry replaces a repeated derivation

`SYNCED_TABLES` currently repeats `Object.keys(<table>.zodSchema.shape)` twelve times. Adding a `zodSchema` field to the entry would make each entry name the same table twice. A single `syncedTable(name, table)` helper builds both fields from one argument, which removes the repeated expression that root CLAUDE.md's duplicate-expression rule targets, and is the reason the change is made this way rather than by appending a field to twelve object literals.

### The device key permission tightening is Unix-only

`0600` is a POSIX file mode with no Windows equivalent, and this project builds for `"targets": "all"`. The `set_permissions` call is therefore `#[cfg(unix)]`-gated. On Windows the default ACL on a per-user app-data directory is already user-scoped, so the gate is a deliberate scoping decision rather than an unfinished port, and the code says so at the call site.

### The CSP lands in its own commit and is verified against a built app

Every other change here is a guard added to a code path with a bounded blast radius. A CSP is a global constraint on what the webview may load, and a policy that is too tight breaks fonts, images, IPC or the updater at runtime with no compile-time signal. It is sequenced last, commits alone, and is verified in two places: `pnpm run dev`, which exercises `devCsp`, and a `pnpm run build` bundle, which exercises `csp` — the one that actually ships. `pnpm run web` cannot verify any of it, because no database-backed screen loads without the Tauri webview.

### `save_image`'s `source_path` stays unvalidated, as an accepted risk

`save_image` takes a caller-supplied `source_path` and copies that file into the images directory, from where it can be read back. Validating `id` does not constrain it. No peer message reaches this command — it is invoked only from the webview file-picker flow — and a compromised webview already holds `sql:allow-execute` and `sql:allow-select`, so this grants an attacker in that position nothing they do not already have. Constraining it properly would require a capability token tying the path to a dialog the user actually opened, which is disproportionate here. The decision is recorded as a comment at the call site so a future reader does not mistake it for an oversight.

## Sub-feature files

- [SF1 — Mention-search injection guard](SPEC_SECURITY_HARDENING_SF1.md)
- [SF2 — Image id path-traversal guard](SPEC_SECURITY_HARDENING_SF2.md)
- [SF3 — Pairing failure counter per endpoint](SPEC_SECURITY_HARDENING_SF3.md)
- [SF4 — Defense-in-depth](SPEC_SECURITY_HARDENING_SF4.md)
- [SF5 — Content Security Policy](SPEC_SECURITY_HARDENING_SF5.md)
- [SF6 — Audit retirement](SPEC_SECURITY_HARDENING_SF6.md)

## CLAUDE.md impact

`app/docs/CLAUDE.md`'s "Files affected" subsection defines exactly four labels — `Modified:`, `New:`, `Moved:`, `Draft:` — and no label for a file a sub-feature deletes. SF6 deletes `app/docs/security-audit-sync-channel.md`, and lists it under `Modified:` with an inline deletion note because no accurate label exists [spec-writer_11: `app/docs/CLAUDE.md` — as of commit 929fb641, the "Files affected" list enumerates `Modified:`, `New:`, `Moved:`, and `Draft:` only].

`app/src-tauri/CLAUDE.md`'s Image Commands section documents `save_image`, `get_image_url`, and `delete_image` and states each one's arguments, describing `id` only as "Image identifier" and "Unique identifier (nanoid)". After SF2, all six image commands reject an `id` containing any character outside `A-Za-z0-9_-`, and `delete_image` and `get_image_url` additionally reject an extension outside `VALID_EXTENSIONS` — neither constraint is stated in that section [spec-writer_12: `app/src-tauri/CLAUDE.md` — as of commit 929fb641, the Image Commands section's argument lists carry no format constraint for `id`, and describe `extension` as "File extension (validated)" for `save_image` only].

`app/db/CLAUDE.md`'s `zodSchema` rule states that `zodSchema` "is used only as a TypeScript type-inference source (`z.infer<typeof table.zodSchema>` derives the domain type, e.g. `Adventure`) — it is never runtime-parsed against a read row anywhere in this codebase." After SF4, `applyUpsert` in `app/db/_sync/apply-upsert.ts` runtime-parses `zodSchema.partial()` against rows arriving from a peer. The quoted sentence remains literally true, since a peer row is not a read row, but the rule's surrounding text is the only place a reader learns what `zodSchema` is for, and it no longer enumerates every use [spec-writer_13: `app/db/CLAUDE.md` — as of commit 929fb641, the "No `zodSchema` field carries `.optional()`" rule contains the quoted sentence].

`app/src-tauri/CLAUDE.md`'s Connectivity Commands section documents `submit_pairing_code` and `request_pairing_code` without stating any attempt limit. SF3 changes where the pairing attempt limit is held and how long it survives, and no documented behavior in that file describes the limit at all [spec-writer_14: `app/src-tauri/CLAUDE.md` — as of commit 929fb641, neither the `submit_pairing_code` nor the `request_pairing_code` entry mentions `MAX_CODE_FAILURES` or an attempt limit].

`app/services/` has no test files anywhere in the repository, and no CLAUDE.md file states a testing convention for that layer — `app/db/CLAUDE.md`'s Testing section is scoped to domain directories under `db/`, and `app/services/CLAUDE.md` has no Testing section. SF1 places the load-bearing guard for a critical injection path in `app/db/mention-search.ts` rather than in `app/services/mentionSearchService.ts` specifically because the service layer has no pattern under which the guard could be tested [spec-writer_15: ran `find app/services -name "*.test.ts" -o -name "*.spec.ts"` — no matches; spec-writer_16: `app/services/CLAUDE.md` — as of commit 929fb641, the file has sections Conventions and What Does NOT Belong Here, and no Testing section].
