# Docs

This directory contains specs and planning documents.
Specs are temporary and will be deleted when implemented.

## Spec / Implementation Plan Format

Always use the following structure when writing a spec or plan:

### Progress tracker (at the top)

```
- Sub-feature 1: <name> — <one-line intent>
- Sub-feature 2: <name> — <one-line intent>
```

The progress tracker is a sequencing reference. The implementing instance reads it to understand the order and dependencies of sub-features before starting work. It is not a live status document — do not modify it during implementation.

**Foundation SFs must be annotated.** A foundation SF is one that modifies a shared utility or type that all other SFs in the batch depend on — its changes make baseline checks (tsc, eslint) structurally impossible to pass until the dependent SFs are also complete. When a SF is a foundation SF:

- Mark it in the progress tracker with `[FOUNDATION]` appended to its name, so the implementer sees at planning time that the batch has a dependency constraint.
- In the SF body's opening description, add the full annotation naming every dependent SF: `[FOUNDATION: SF2–SF6 depend on this]`.

Both annotations are required. The tracker marker is a planning-time signal; the SF body annotation is the actionable instruction visible when the implementer is actively in that SF.

### Key Architectural Decisions

Required section in every spec, placed after the progress tracker and before the first sub-feature section. Document every non-obvious structural choice the implementing instance needs to understand — data model shape, state ownership, persistence decisions, naming corrections, and anything the architecture implies but does not make explicit.

Each entry: a short heading stating the decision, followed by one paragraph of rationale. Cross-reference the CLAUDE.md rule that drove it when one applies. State decisions as facts — never attribute them to a conversation, a person, or a prior agent. The spec is consumed by a fresh implementing instance with no conversational context; provenance is noise.

In split format, this section lives exclusively in the root index file. Sub-feature files do not contain their own decision sections.

### Per sub-feature section

Each sub-feature gets a heading with its name and a short description of its intent, followed by:

**Files affected** — required subsection before the layered breakdown. Three labeled lists:

- `Modified:` — existing files changed by this sub-feature
- `New:` — files created by this sub-feature
- `Moved:` — files relocated without content changes: `mv <source> <destination>`

Every file touched must appear here — including barrel files, index files, and type files. No file may appear only in prose.

**Test fixture accuracy.** When a Modified file changes observable behavior — any error message string, return value, guard condition, or function signature — the corresponding `__tests__/` file must also appear under `Modified:` with an annotation naming the specific assertions that go stale. Listing only the implementation file is a spec defect when the behavioral change invalidates an existing assertion.

- ✅ `Modified: db/image/remove.ts` — error message changed; `Modified: db/image/__tests__/remove.test.ts` — update error message assertion from `'Image ID is required'` to `'Valid image ID is required'`
- ❌ `Modified: db/image/remove.ts` only — the `__tests__/` file's assertion becomes stale but is not listed

When a file is relocated, use `Moved:` — never decompose a move into a `New:` entry plus a deletion note under `Modified:`. When the relocated file also requires content changes (e.g. internal import paths must be updated), list it under `Moved:` and add the content changes as a note: `mv <source> <destination>, then update <what changes>`.

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

### CLAUDE.md impact

Required section in every spec. Before marking a spec complete, evaluate:

- Do any CLAUDE.md files reference files, paths, or modules that this spec adds, renames, or removes?
- Does this spec introduce a new structural pattern (e.g. a new layer, directory convention, or module shape) that should be documented?
- Does this spec make a previously documented example invalid?

For each impact found, list the affected CLAUDE.md file and the required update. If there is no impact, write "None." This section is addressed to the implementing instance — every entry must be a concrete, self-contained file-level instruction. Do not reference other agents, commands, conversations, or briefs.

### Split format

When a spec is expected to exceed ~400 lines, use the split format instead of a single file:

- **Root index file** (`SPEC_<FEATURE>.md`): contains the progress tracker, Key Architectural Decisions section, the CLAUDE.md impact section, and a file list with relative links to each sub-feature file.
- **Sub-feature files** (`SPEC_<FEATURE>_SF<N>.md`): each contains exactly one sub-feature's layered breakdown. Never put more than one sub-feature section in a split file.

The layered order rule (DB changes → Services → Data Access Layer → Frontend) applies inside each sub-feature file unchanged.

**Progress tracker placement**: the progress tracker lives exclusively in the root index file. Sub-feature files do not contain their own trackers. The root index file is the authoritative status document for the entire spec.

**CLAUDE.md impact section placement**: the CLAUDE.md impact section lives exclusively in the root index file. Sub-feature files do not contain their own CLAUDE.md impact sections. The assessment must cover the spec as a whole — evaluate all sub-features together before writing the impact entry.
