# CLAUDE.md impact — route to `/refine-claude`

Extracted verbatim from the "CLAUDE.md impact" section of `app/docs/SPEC_SECURITY_HARDENING.md` by an `/implement` session on branch `docs/security-audit-sync-channel`, before that spec file's deletion. Each entry is a stated fact and its consequence, as the spec wrote it — not an instruction to apply. Root CLAUDE.md bars every role, including the implementing one, from editing a CLAUDE.md file directly; these are handoff material for a `/refine-claude` session.

Five entries, affecting four files.

---

## `app/docs/CLAUDE.md`

`app/docs/CLAUDE.md`'s "Files affected" subsection defines exactly four labels — `Modified:`, `New:`, `Moved:`, `Draft:` — and no label for a file a sub-feature deletes. SF6 deletes `app/docs/security-audit-sync-channel.md`, and lists it under `Modified:` with an inline deletion note because no accurate label exists [spec-writer_11: `app/docs/CLAUDE.md` — as of commit 929fb641, the "Files affected" list enumerates `Modified:`, `New:`, `Moved:`, and `Draft:` only].

---

## `app/src-tauri/CLAUDE.md` — Image Commands

`app/src-tauri/CLAUDE.md`'s Image Commands section documents `save_image`, `get_image_url`, and `delete_image` and states each one's arguments, describing `id` only as "Image identifier" and "Unique identifier (nanoid)". After SF2, all six image commands reject an `id` containing any character outside `A-Za-z0-9_-`, and `delete_image` and `get_image_url` additionally reject an extension outside `VALID_EXTENSIONS` — neither constraint is stated in that section [spec-writer_12: `app/src-tauri/CLAUDE.md` — as of commit 929fb641, the Image Commands section's argument lists carry no format constraint for `id`, and describe `extension` as "File extension (validated)" for `save_image` only].

---

## `app/db/CLAUDE.md` — the `zodSchema` rule

`app/db/CLAUDE.md`'s `zodSchema` rule states that `zodSchema` "is used only as a TypeScript type-inference source (`z.infer<typeof table.zodSchema>` derives the domain type, e.g. `Adventure`) — it is never runtime-parsed against a read row anywhere in this codebase." After SF4, `applyUpsert` in `app/db/_sync/apply-upsert.ts` runtime-parses `zodSchema.partial()` against rows arriving from a peer. The quoted sentence remains literally true, since a peer row is not a read row, but the rule's surrounding text is the only place a reader learns what `zodSchema` is for, and it no longer enumerates every use [spec-writer_13: `app/db/CLAUDE.md` — as of commit 929fb641, the "No `zodSchema` field carries `.optional()`" rule contains the quoted sentence].

---

## `app/src-tauri/CLAUDE.md` — Connectivity Commands

`app/src-tauri/CLAUDE.md`'s Connectivity Commands section documents `submit_pairing_code` and `request_pairing_code` without stating any attempt limit. SF3 changes where the pairing attempt limit is held and how long it survives, and no documented behavior in that file describes the limit at all [spec-writer_14: `app/src-tauri/CLAUDE.md` — as of commit 929fb641, neither the `submit_pairing_code` nor the `request_pairing_code` entry mentions `MAX_CODE_FAILURES` or an attempt limit].

---

## `app/services/CLAUDE.md` — absent testing convention

`app/services/` has no test files anywhere in the repository, and no CLAUDE.md file states a testing convention for that layer — `app/db/CLAUDE.md`'s Testing section is scoped to domain directories under `db/`, and `app/services/CLAUDE.md` has no Testing section. SF1 places the load-bearing guard for a critical injection path in `app/db/mention-search.ts` rather than in `app/services/mentionSearchService.ts` specifically because the service layer has no pattern under which the guard could be tested [spec-writer_15: ran `find app/services -name "*.test.ts" -o -name "*.spec.ts"` — no matches; spec-writer_16: `app/services/CLAUDE.md` — as of commit 929fb641, the file has sections Conventions and What Does NOT Belong Here, and no Testing section].

---

## Note on citation currency

Every citation above is a repo-state citation pinned to commit `929fb641`. Root CLAUDE.md requires a repo-state citation to be re-checked against current HEAD before use, since repo state changes within a session. Two of the five targets have moved since `929fb641` in ways that do not invalidate the entries but should be re-verified by whoever acts on them: this branch has since committed changes to `app/db/_sync/apply-upsert.ts` and the six Rust image command files, which is what makes entries 2 and 3 true rather than anticipated. The CLAUDE.md files themselves are unmodified by this branch.
