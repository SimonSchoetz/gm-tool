# Docs

This directory contains specs and planning documents. Specs are temporary and will be deleted when implemented; their structure (sections, markers, split format) is supplied by the tooling that writes them, and the Spec Format Extension below adds this project's own rules to it.

`domain-scaffold.md` is a long-living infrastructure reference document — it is NOT a temporary spec and must not be deleted after implementation. Update it when core domain infrastructure changes (new layers, changed conventions, new ambient systems).

## Spec Format Extension

**Layered breakdown** — layers in dependency order:

1. DB changes (schema, seed, CRUD)
2. Services
3. Data Access Layer
4. Frontend (components, screens)

**Modified-file scan items.** For every file listed under `Modified:` in any Files affected subsection, check explicitly for: (1) inline sub-components; (2) `return null`/`return undefined` in void contexts.

**`[MANUAL-VERIFY]` trigger.** The testing-policy exemption is `app/src/CLAUDE.md` — Testing Policy's Forbidden bullet (React components); the risk category that bullet excludes from the exemption is interaction behavior tied to the browser's native default action. Testing Policy's required scope is `ComponentName/helper/` and `/src/util/`.

**Barrel instructions require explicit validation.** Before writing any barrel instruction (including "no change needed"), read the actual barrel file and verify every export against the barrel conventions in `app/CLAUDE.md` — Directory Structure. Existing `export *` is not evidence that it is correct. A spec that instructs "no change needed" for a barrel that violates the explicit-exports rule is a spec defect.

**Test fixture accuracy example.** ✅ `Modified: db/image/remove.ts` — error message changed; `Modified: db/image/__tests__/remove.test.ts` — update error message assertion from `'Image ID is required'` to `'Valid image ID is required'`. ❌ `Modified: db/image/remove.ts` only.

**CLAUDE.md impact — `domain-scaffold.md`.** `app/docs/_product/domain-scaffold.md` is this project's long-living reference document for the impact section's reference-document bullets: a stale reference, a missing section, or an invalidated example there is resolved by editing it during this spec's own implementation, encoded as `Modified: app/docs/_product/domain-scaffold.md — <what changes>` in the relevant sub-feature's Files affected list.
