# SF6 — Audit retirement

`app/docs/security-audit-sync-channel.md` states its own disposition: it is a working document, to be deleted once every finding is either fixed or explicitly accepted. Sub-features 1 through 5 close all four findings, and the two exposures it did not raise — `save_image`'s unvalidated `source_path`, and the fact that schema validation of peer rows catches type violations but not semantic ones — are recorded as accepted risks in code comments and in this spec's Key Architectural Decisions. The document has no remaining function.

It also names four areas it never covered, which do not disappear with it. Those become a scoping document for a second audit pass. That pass is not part of this spec: none of the four has an established exploitation chain, and a fix cannot be specified for a finding that has not been made yet.

## Files affected

`Modified:`

- `app/docs/security-audit-sync-channel.md` — deleted by this sub-feature; there is no replacement at this path. `app/docs/CLAUDE.md` defines no label for a deleted file, so it is listed here under `Modified:` and the gap is recorded in the root spec's CLAUDE.md impact section.

`New:`

- `app/docs/security-audit-round-2-scope.md` — the scoping document for the follow-up audit

## Frontend

No change. This sub-feature touches documentation only.

## The new document

Create `app/docs/security-audit-round-2-scope.md` with the content below. It is a scope, not a findings record: each area states what to read and what question to answer, and nothing in it asserts a vulnerability exists.

````markdown
# Security Audit Round 2 — Scope

Companion to the completed LAN sync channel audit, whose findings were fixed and whose record was deleted on completion. This document scopes the areas that audit named as uncovered. Nothing here is a finding. Each area states what to read and the question to answer; a finding exists only once a chain has been established link by link with a citation per link, in the format the first audit used.

The trust model the first audit established still applies and does not need re-deriving: the transport is iroh QUIC over LAN with relays disabled and no DNS or pkarr publishing, so mDNS is the sole address lookup and nothing is reachable from the internet. The main sync ALPN refuses any endpoint id outside the trusted set, and an iroh endpoint id is the remote's TLS public key, so it is not spoofable without the corresponding secret key. The pairing ALPN is accepted from anyone, but only while the user has the pairing dialog open. The two attacker positions are an already-paired device, and a LAN-adjacent device during an open pairing window.

## Area 1 — Updater command surface and signature verification

**Read:** `app/src-tauri/src/commands/updater/` in full; the `plugins.updater` block in `app/src-tauri/tauri.conf.json`; the resolved `tauri-plugin-updater` version in `app/src-tauri/Cargo.lock`, and that version's source in the local Cargo registry.

**Question:** Can a network attacker, or a `latest.json` an attacker controls, cause an unsigned or attacker-signed binary to install?

Establish specifically: that the minisign public key configured in `tauri.conf.json` is actually enforced by the installed plugin version rather than merely present in config; that the bytes `install_and_relaunch` consumes can only have come from a `download_update` call that passed that verification, with no path by which `PendingInstallState` receives bytes from any other source; and that the configured endpoint cannot be downgraded from HTTPS or redirected to another host.

## Area 2 — Lexical editor node deserialization

**Read:** every call site that turns stored editor content back into nodes — `editor.parseEditorState`, `$generateNodesFromDOM`, and any custom `importJSON` on a node class under `app/src/components/TextEditor/`.

**Question:** Does a synced entity's rich-text column reach Lexical deserialization, and can a crafted node payload execute code, reach an HTML sink, or exfiltrate through a decorator node?

This matters because the columns holding editor content are synced, which makes their contents peer-controlled under the trust model above. The first audit's grep for HTML-injection sinks covered application code and found none; this pass re-runs that question against the registered Lexical node set specifically, including every `DecoratorNode` subclass, rather than against `app/src/` as a whole.

## Area 3 — Dependency supply chain

**Read:** the output of `pnpm audit` from `app/`, and `cargo audit` from `app/src-tauri/`.

**Question:** For each advisory reported, is the vulnerable code path reachable from peer input or from the webview?

Triage each advisory to one of: reachable from a peer message, reachable from the webview only, or unreachable in this application. An advisory in a build-time-only dependency is unreachable and should be recorded as such rather than carried forward. The output is a written disposition per advisory. Whether these scans should run in CI is a separate decision and not part of this pass.

## Area 4 — `_settings` and `_system` write paths

**Read:** every writer of both tables, not only the accessors the first audit checked — `app/db/_system/update.ts`, every `app/db/_system/{key}.ts` accessor, and everything under `app/db/_settings/`.

**Question:** Can any `_settings` or `_system` key be written from a sync path or from a peer message?

Neither table is in `SYNCED_TABLES`, so the expected answer is no. Confirm it rather than assuming it, and trace whether any service reachable from a sync message handler writes either table indirectly. A peer able to write `_system` would control this device's stored network identity and its recorded migration head, which is a different severity tier from anything the first audit found.

## Output format

Append one findings section per area to this file, following the structure the first audit used: a stated finding with a severity, a numbered chain with one citation per link, what limits the exposure, and a recommended fix. Once every area has either a findings section or an explicit "no finding" statement, this document becomes the input to a fix spec and is deleted on that spec's completion, the same way its predecessor was.
````
