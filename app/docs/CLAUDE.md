# Docs

This directory contains specs and planning documents.
Specs are temporary and will be deleted when implemented.

## Spec / Implementation Plan Format

Always use the following structure when writing a spec or plan:

### Progress tracker (at the top)

```
- [ ] Sub-feature 1: <name> — <one-line intent
- [ ] Sub-feature 2: <name> — <one-line intent>
```

### Per sub-feature section

Each section must follow this layered order:

1. DB changes (schema, seed, CRUD)
2. Services
3. Data Access Layer
4. Frontend (components, screens)

Each sub-feature gets a heading with its name and a short description of its intent before the layered breakdown.

### CLAUDE.md impact

Required section in every spec. Before marking a spec complete, evaluate:

- Do any CLAUDE.md files reference files, paths, or modules that this spec adds, renames, or removes?
- Does this spec introduce a new structural pattern (e.g. a new layer, directory convention, or module shape) that should be documented?
- Does this spec make a previously documented example invalid?

For each impact found, list the affected CLAUDE.md file and the required update. If there is no impact, write "None."
