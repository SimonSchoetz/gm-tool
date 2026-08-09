# CLAUDE.md impact — route to /refine-claude

Producing role: `implement`. Source spec: `app/docs/SPEC_PREFETCH.md`. Branch: `feat/queryoptions-carveout`.

Extracted verbatim from `SPEC_PREFETCH.md`'s own "## CLAUDE.md impact" section, as written by spec-writer. `app/docs/_product/domain-scaffold.md`'s own impact item was resolved directly during SF5 (per the section's stated exception for that file) and is not repeated here — see `app/docs/_product/domain-scaffold.md` at the current branch HEAD for the applied result.

- `app/src/CLAUDE.md`'s State Management section documents the data-access-layer file split as "query keys, single-entity hooks, and collection hooks each own a separate file". This spec adds a fourth file kind to every domain module (`<domain>QueryOptions.ts`), so that enumeration no longer describes the layer. [spec_2: app/src/CLAUDE.md — State Management & Error Handling, as of 6ebbf7d6]
- `app/src/CLAUDE.md`'s Structure tree describes `routes/` as "Tanstack router" with no mention that route files now own data resolution. Route files gain a `loader` responsibility that the tree comment does not convey. [spec_3: app/src/CLAUDE.md — Structure, as of 6ebbf7d6]
- `MentionPopupContent` switches over eight mention entity types, and SF6 adds `mentionPrefetchByType` keyed by that same set. Mention entity type is now enumerated in two places that must stay in sync, with no documented registration flow naming either as canonical; adding a ninth mentionable entity requires updating both, and no check enforces it. The two sites serve different concerns — rendering versus cache warming — so merging them is not the resolution. [spec_4: app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx:24-51, as of 6ebbf7d6]
