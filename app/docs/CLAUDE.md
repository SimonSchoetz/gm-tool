# Docs

This directory contains specs and planning documents.
Specs are temporary and will be deleted when implemented.

## Spec / Implementation Plan Format

Always use the following structure when writing a spec or plan:

### Progress tracker (at the top)

```
- [ ] Sub-feature 1: <name> — <one-line intent>
- [ ] Sub-feature 2: <name> — <one-line intent>
```

### Per sub-feature section

Each section must follow this layered order:

1. DB changes (schema, seed, CRUD)
2. Services
3. Provider / hooks
4. Frontend (components, screens)

Each sub-feature gets a heading with its name and a short description of its intent before the layered breakdown.
