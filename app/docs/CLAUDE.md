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

### Per sub-feature section

Each section must follow this layered order:

1. DB changes (schema, seed, CRUD)
2. Services
3. Data Access Layer
4. Frontend (components, screens)

Before writing each layer, cross-check the plan against conventions documented for that layer in the relevant scoped CLAUDE.md (e.g. error wrapping in Services, TanStack Query patterns in the DAL). A spec that omits a required pattern is incomplete, not just unimplemented.

Each sub-feature gets a heading with its name and a short description of its intent before the layered breakdown.

### CLAUDE.md impact

Required section in every spec. Before marking a spec complete, evaluate:

- Do any CLAUDE.md files reference files, paths, or modules that this spec adds, renames, or removes?
- Does this spec introduce a new structural pattern (e.g. a new layer, directory convention, or module shape) that should be documented?
- Does this spec make a previously documented example invalid?

For each impact found, list the affected CLAUDE.md file and the required update. If there is no impact, write "None."

### Split format

When a spec is expected to exceed ~400 lines, use the split format instead of a single file:

- **Root index file** (`SPEC_<FEATURE>.md`): contains the progress tracker, key architectural decisions, the CLAUDE.md impact section, and a file list with relative links to each sub-feature file.
- **Sub-feature files** (`SPEC_<FEATURE>_SF<N>.md`): each contains exactly one sub-feature's layered breakdown. Never put more than one sub-feature section in a split file.

The layered order rule (DB changes → Services → Data Access Layer → Frontend) applies inside each sub-feature file unchanged.

**Progress tracker placement**: the progress tracker lives exclusively in the root index file. Sub-feature files do not contain their own trackers. The root index file is the authoritative status document for the entire spec.

**CLAUDE.md impact section placement**: the CLAUDE.md impact section lives exclusively in the root index file. Sub-feature files do not contain their own CLAUDE.md impact sections. The assessment must cover the spec as a whole — evaluate all sub-features together before writing the impact entry.
