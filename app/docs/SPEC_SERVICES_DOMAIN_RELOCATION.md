# Services and Domain Relocation

## Progress Tracker

- SF1: Config [FOUNDATION] — add `@services` and `@domain` path aliases; expand `include`
- SF2: Move domain — `mv app/src/domain app/domain`; update all `@/domain` imports
- SF3: Move services — `mv app/src/services app/services`; update all `@/services` imports
- SF4: Documentation — update `app/src/CLAUDE.md`; create `app/services/CLAUDE.md` and `app/domain/CLAUDE.md`

## Key Architectural Decisions

### Why both `domain/` and `services/` must move together

Services import from `@/domain` (error factories). If services move to `app/services/`
without domain also moving, services would need to import from `app/src/domain/` — a
cross-boundary dependency on the frontend directory that is structurally worse than
the status quo. The two moves are a single atomic decision.

### `@domain` alias form matches `@util`

`tsconfig.json` already establishes a precedent with `@util` (exact barrel alias) and
`@util/*` (glob alias). `@domain` and `@domain/*` follow the same pattern. `@services`
uses only the glob form `@services/*` — there is no services barrel.

### Import path replacement rule

Every `@/domain` occurrence becomes `@domain`. Every `@/domain/<subpath>` occurrence
becomes `@domain/<subpath>`. Every `@/services/<file>` occurrence becomes
`@services/<file>`. These are pure string replacements — no logic changes anywhere.

### Ordering constraint

SF1 is a Foundation SF. The `mv` commands in SF2 and SF3 can occur in any order
relative to each other, but both require SF1's aliases to be in place before baseline
checks (`tsc`, `eslint`) can pass. SF4 has no code dependency but should run last.

### Interaction with SPEC_SESSION_CASCADE.md

`SPEC_SESSION_CASCADE.md` touches `app/src/services/sessionService.ts` and
`app/src/services/sessionStepService.ts`. If this relocation spec is implemented
first, those paths become `app/services/sessionService.ts` and
`app/services/sessionStepService.ts`. The two specs are otherwise independent — the
session cascade can be implemented in either order relative to this spec.

## CLAUDE.md Impact

See SF4 for the full set of required documentation changes. Summary:

- `app/src/CLAUDE.md` — remove `domain/` and `services/` from the directory tree;
  update the Domain Layer section reference and framing; update the layer
  responsibilities reference in the TanStack Query pattern section
- New `app/services/CLAUDE.md` — service layer conventions extracted from
  `app/src/CLAUDE.md`
- New `app/domain/CLAUDE.md` — domain layer conventions extracted from
  `app/src/CLAUDE.md`, reframed as application-level (not frontend-level)

## Sub-feature Files

- [SF1: Config](SPEC_SERVICES_DOMAIN_RELOCATION_SF1.md)
- [SF2: Move domain](SPEC_SERVICES_DOMAIN_RELOCATION_SF2.md)
- [SF3: Move services](SPEC_SERVICES_DOMAIN_RELOCATION_SF3.md)
- [SF4: Documentation](SPEC_SERVICES_DOMAIN_RELOCATION_SF4.md)
