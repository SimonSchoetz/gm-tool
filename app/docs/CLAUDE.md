# Docs

This directory contains specs and planning documents.
Specs are temporary and will be deleted when implemented.

`domain-scaffold.md` is a long-living infrastructure reference document — it is NOT a
temporary spec and must not be deleted after implementation. Update it when core domain
infrastructure changes (new layers, changed conventions, new ambient systems).

## Spec / Implementation Plan Format

Always use the following structure when writing a spec or plan:

### Progress tracker (at the top)

```
- Sub-feature 1: <name> — <one-line intent>
- Sub-feature 2: <name> — <one-line intent>
```

The progress tracker is a sequencing reference. The implementing instance reads it to understand the order and dependencies of sub-features before starting work. It is not a live status document — do not modify it during implementation.

**Foundation SFs must be annotated.** A Foundation SF is any SF that, if committed alone, would leave baseline checks (tsc, eslint) structurally unable to pass. Two conditions trigger this:

- **Modification direction**: the SF modifies a shared utility or type that one or more other SFs in the same batch depend on, and that modification leaves the utility in a state where baseline checks cannot pass until all dependent SFs are complete.
- **Provider direction**: the SF adds exports to a shared module that one or more earlier SFs in the spec already import — meaning those earlier SFs fail tsc until this SF is implemented.

When a SF meets either condition:

- Mark it in the progress tracker with `[FOUNDATION]` appended to its name, so the implementer sees at planning time that the batch has a dependency constraint.
- In the SF body's opening description, add the full annotation naming every dependent SF: `[FOUNDATION: SF2–SF6 depend on this]`.

Both annotations are required. The tracker marker is a planning-time signal; the SF body annotation is the actionable instruction visible when the implementer is actively in that SF.

**Foundation SF annotations must enumerate every file to stage as a unit.** When a Foundation SF spans files across more than one directory level, the SF body annotation must include a "Stage as unit:" line listing every file path that belongs in the Foundation commit — including files in parent directories of any subdirectory being staged. A directory path is never a sufficient proxy for this list; directory staging silently omits sibling files at adjacent levels.

- ✅ `[FOUNDATION: SF2–SF4 depend on this. Stage as unit: src/components/Foo/Foo.tsx, src/components/Foo/components/Bar.tsx, src/components/Foo/components/index.ts]`
- ❌ `[FOUNDATION: SF2–SF4 depend on this]` — no file list; implementer must infer scope and risks missing files at adjacent directory levels
- ❌ `[FOUNDATION: SF2–SF4 depend on this. Stage as unit: same as SF3's Foundation annotation]` — delegation to another SF's file list is not permitted; every Foundation annotation must enumerate its own complete file list inline; an implementer starting from that SF will not re-read another annotation to reconstruct the stage set

### Key Architectural Decisions

Required section in every spec, placed after the progress tracker and before the first sub-feature section. Document every non-obvious structural choice the implementing instance needs to understand — data model shape, state ownership, persistence decisions, naming corrections, and anything the architecture implies but does not make explicit.

Each entry: a short heading stating the decision, followed by one paragraph of rationale. Cross-reference the CLAUDE.md rule that drove it when one applies. State decisions as facts — never attribute them to a conversation, a person, or a prior agent. The spec is consumed by a fresh implementing instance with no conversational context; provenance is noise.

**SF self-containment for architectural consequences.** When a KAD produces a structural choice in a specific SF that an implementer reading only that SF file would find surprising — a type from a foreign layer appearing as a parameter, a deliberate deviation from a boundary rule, or any choice whose rationale lives only in the root KAD section — the SF body must include a brief inline rationale note at the decision site. The note must name the KAD heading it corresponds to. An SF that contains a surprising structural choice with no inline rationale is a spec defect: the implementing instance has no basis to distinguish intentional design from error.

### Per sub-feature section

Each sub-feature gets a heading with its name and a short description of its intent, followed by:

**Files affected** — required subsection before the layered breakdown. Three labeled lists:

- `Modified:` — existing files changed by this sub-feature
- `New:` — files created by this sub-feature
- `Moved:` — files relocated without content changes: `mv <source> <destination>`
- `Draft:` — files that already exist at spec-writing time, created by the spec-writing process itself (e.g. scratch verification kept rather than reverted). Requires full implementer review and normal commit discipline — never assume correctness or completeness because the file passed checks during spec authoring.

Every file touched must appear here — including barrel files, index files, and type files. No file may appear only in prose.

**Test coverage from architectural decisions.** When the Key Architectural Decisions section identifies two or more distinct code paths (e.g., "row is absent" vs. "row value is SQL NULL"), the test section must enumerate one named test per path. The decision text is the authoritative source for test names — collapsing two named paths into one test, or naming a test after the wrong path, is a spec defect.

**Test fixture accuracy.** When a Modified file changes observable behavior — any error message string, return value, guard condition, or function signature — the corresponding `__tests__/` file must also appear under `Modified:` with an annotation naming the specific assertions that go stale. Listing only the implementation file is a spec defect when the behavioral change invalidates an existing assertion.

- ✅ `Modified: db/image/remove.ts` — error message changed; `Modified: db/image/__tests__/remove.test.ts` — update error message assertion from `'Image ID is required'` to `'Valid image ID is required'`
- ❌ `Modified: db/image/remove.ts` only — the `__tests__/` file's assertion becomes stale but is not listed

When a file is relocated, use `Moved:` — never decompose a move into a `New:` entry plus a deletion note under `Modified:`. When the relocated file also requires content changes (e.g. internal import paths must be updated), list it under `Moved:` and add the content changes as a note: `mv <source> <destination>, then update <what changes>`.

**Insertion anchor validity.** When a spec instructs the implementer to insert code at a named anchor line within an existing file (e.g., "add directly after `const [x, setX]`"), verify before writing that the anchor line appears after every dependency of the inserted declarations. If the inserted declarations reference a value declared below the proposed anchor, the anchor is wrong — state the correct anchor that appears after the last required dependency. A spec that names an anchor that precedes a dependency of the inserted code is a spec defect that will cause a tsc-blocking ordering error.

**Layered breakdown** — layers in dependency order:

1. DB changes (schema, seed, CRUD)
2. Services
3. Data Access Layer
4. Frontend (components, screens)

This is a dependency order, not style: a layer may only reference what layers below it have already specified. Before writing each layer, cross-check the plan against conventions documented for that layer in the relevant scoped CLAUDE.md (e.g. error wrapping in Services, TanStack Query patterns in the DAL). A spec that omits a required pattern is incomplete, not just unimplemented.

**Cross-SF symbol lifecycle** — when a sub-feature introduces a symbol (a type field, exported constant, or any value) that has no consumer within the same sub-feature, the spec must explicitly name the later sub-feature that will wire it. A symbol with no current consumer and no forward reference is a spec defect, not a placeholder. The implementing instance has no basis to distinguish "intentionally deferred" from "accidentally omitted" without this annotation.

- ✅ `placeholder: string` introduced in SF2 with annotation: "consumed by SF3 — wired to `TextEditor` placeholder prop in `StepSection.tsx`"
- ❌ `placeholder: string` introduced in SF2 with no mention of a consumer anywhere in the spec

**Barrel instructions require explicit validation.** Before writing any barrel instruction (including "no change needed"), read the actual barrel file and verify every export against the current barrel conventions in root CLAUDE.md. Never infer barrel correctness from the file's current state — existing `export *` is not evidence that `export *` is correct. A spec that instructs "no change needed" for a barrel that violates the explicit-exports rule is a spec defect.

For the **Frontend** layer, always specify:

- **Purpose** — what this component or screen does and why it exists at this point in the feature
- **Behavior** — user interactions, state managed, side effects, edge cases (loading, error, empty)
- **UI / Visual** — layout structure, component composition, styling notes

A Frontend layer entry that omits any of the three is incomplete.

**Specs must carry decisions, not derivations — regardless of whether the derivable content comes from an existing reference file or from the spec-writer's own design work.** Two independent patterns trigger this:

- **Reference-file substitution**: when a sub-feature's implementation can be fully derived from a named reference file plus a mechanical substitution table (e.g., a new domain entity following an established scaffold pattern), do not reproduce the file body in the spec. Name the reference file and state the substitution table. Before naming any file as a reference, validate it against current CLAUDE.md conventions per root CLAUDE.md's "Validate before replicating" rule — that rule binds at spec-writing time, not only at implementation time: a spec that names a non-compliant file as a reference propagates the violation into every implementer who follows the substitution table. If the candidate reference file has a violation, either name a different, compliant reference, or state the deviation explicitly in the spec's substitution table so the implementer does not copy it.
- **Original design with no reference file**: when a KAD establishes a structural decision (e.g., which module owns a piece of state, what a derived value's shape is), state the decision and its shape — not a full, near-final function or component body the decision implies. A decision such as "the hook owns pairing mode; `mode` is derived from candidate/code-request state, not stored separately" is the spec content; the function body that implements it is derivable by any implementer who has the decision and the shape, and belongs in implementation, not the spec.

In both cases the spec must still fully specify: (1) any content that differs from a reference or that a decision does not fully determine, (2) the required assertion list for each test file (specific strings, error messages, SQL shapes), and (3) cross-SF consumer annotations. A spec that reproduces zero-decision content at full length — whether copied from a reference or freshly authored to look like final code — is not more complete: it dilutes signal with noise and increases the cost of reading without adding implementation guidance.

### CLAUDE.md impact

Required section in every spec. Before marking a spec complete, evaluate:

- Do any CLAUDE.md files reference files, paths, or modules that this spec adds, renames, or removes?
- Does this spec introduce a new structural pattern (e.g. a new layer, directory convention, or module shape) that should be documented?
- Does this spec make a previously documented example invalid?
- Does this spec add or change anything that would affect a new domain implementation — a new layer, a changed ambient system, a new convention, or a new infrastructure touch point? If yes, update `app/docs/_product/domain-scaffold.md`.
- Did writing this spec establish a fact via toolchain execution (not a file read) that generalizes beyond this spec? If yes, its authoritative statement belongs in the relevant CLAUDE.md file, cited with the toolchain-execution citation form — not stated in full only in this spec's KAD. A KAD entry may still reference it by heading, so any SF needing the rationale (per SF self-containment) has a heading to name.

For each impact found, state the affected CLAUDE.md file, the fact or structural change driving the update, and its citation per the Epistemological Discipline citation format. If there is no impact, write "None." This section is handoff material for a future `/refine-claude` session — never edit instructions for the implementing instance. Root CLAUDE.md bars direct CLAUDE.md edits by any role, including the instance implementing this spec; phrasing an entry as a directive to apply ("add X to file Y") violates that rule even when the same instance would carry it out. Write each entry as a stated fact plus its consequence (e.g. "`app/src-tauri/CLAUDE.md`'s Dependencies list is missing `tokio` and `futures-core`, both required by SF1's stream-multiplexing contract [I_2: ran `cargo build` — missing crate errors for `tokio`, `futures-core`]") — not as an instruction. Entries must still be self-contained and reference no other agents, commands, conversations, or briefs: this section is the only surviving record once the spec is deleted, so it cannot rely on conversational context to be actionable later.

### Split format

When a spec is expected to exceed ~400 lines, use the split format instead of a single file:

- **Root index file** (`SPEC_<FEATURE>.md`): contains the progress tracker, Key Architectural Decisions section, the CLAUDE.md impact section, and a file list with relative links to each sub-feature file.
- **Sub-feature files** (`SPEC_<FEATURE>_SF<N>.md`): each contains exactly one sub-feature's layered breakdown only. Never duplicate a root-index-exclusive section (progress tracker, Key Architectural Decisions, CLAUDE.md impact) in a sub-feature file, and never put more than one sub-feature section in a split file.

The layered order rule (DB changes → Services → Data Access Layer → Frontend) applies inside each sub-feature file unchanged.

**CLAUDE.md impact assessment scope**: must cover the spec as a whole — evaluate all sub-features together before writing the impact entry, even though the section itself lives only in the root index file.
