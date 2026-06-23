# Knowledge Base

This directory caches verified facts about external systems — library APIs, schema values, CLI flags, config formats, and any other specification defined outside this repository. Caching eliminates redundant verification lookups across agents and sessions.

## Purpose and Scope

An entry belongs here when:

- The fact was verified against an external source (documentation, type declarations, schema URL, toolchain output)
- The fact is tied to a specific version of the external system
- The fact is likely to be needed again by a future agent

One file per external system category (e.g., `tauri.md`, `tanstack-query.md`, `lexical.md`). Create the file on first write; do not pre-create empty files.

## Canonical Entry Format

Every entry must follow this structure exactly:

```markdown
## <Short declarative heading>

**Verified at:** <version string, schema URL with version, or bare URL + date when no version exists>
**Citation:** [Role_N: source]

<Fact body — one to three sentences stating the verified fact.>
```

The heading must be a declarative statement of the fact, not a question or topic label. The citation must use the standard `[Role_N: source]` format from the Epistemological Discipline section of the root `CLAUDE.md`.

## Write Obligation

Any agent that verifies an external-system fact must write it here before completing the verification task. The obligation fires on completion of verification — not on first use of the fact. If the agent lacks Write or Edit permission, it must surface the unrecorded fact to the caller so an agent with permission can persist it.

## Step 0: Check Before Verifying

Before performing any external-system verification, read the relevant category file and check whether the fact is already recorded at the current installed version. If the entry exists and the version matches, treat it as established — no further lookup is needed. Proceed to verification only when the fact is absent or the recorded version does not match.

## Staleness Protocol

An entry is stale when the recorded version does not match the currently installed version (from `package.json`, a schema URL, or equivalent). When a stale entry is found, re-verify against the current version, then append the following block to the existing entry — never overwrite:

```markdown
---
**Reverified at:** <new version string or URL + date>
**Citation:** [Role_N: source]

<Updated fact body, or "Unchanged." if the fact is identical.>
```

The original entry remains as a historical record.

## Error Correction

When reading an entry and finding it incorrect — the fact is wrong, the citation is broken, or the version field is malformed — correct it in the same pass. Do not leave a known-incorrect entry in place. This mirrors the "fix violations in files you touch" rule and applies to all agents with Write or Edit permission.
