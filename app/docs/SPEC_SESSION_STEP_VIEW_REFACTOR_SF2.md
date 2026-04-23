# SF2: LazyDmStepDefinition Placeholder

Add `placeholder: string` to `LazyDmStepDefinition` and populate all 8 entries in `LAZY_DM_STEPS`.

## Files Affected

**Modified:**
- `app/src/domain/session-steps/lazyDmSteps.ts`

**New:** none

## Layered Breakdown

### Domain

**`app/src/domain/session-steps/lazyDmSteps.ts`**

Add `placeholder: string` to `LazyDmStepDefinition`:

```ts
export type LazyDmStepDefinition = {
  key: LazyDmStepKey;
  name: string;
  tooltip: string;
  placeholder: string;
};
```

Populate `placeholder` for all 8 entries in `LAZY_DM_STEPS`:

| key | placeholder |
|-----|-------------|
| `review_characters` | `What do they want? What plays into their backgrounds? What do their players enjoy?` |
| `strong_start` | `Describe the opening scene — what's happening and what immediately demands attention?` |
| `potential_scenes` | `A few words per scene, one or two scenes per expected hour of play` |
| `secrets_clues` | `Short, context-free clues the characters might discover — one sentence each` |
| `fantastic_locations` | `Name the location, then list three evocative details` |
| `important_npcs` | `Name, connection to the adventure, and a fictional archetype they embody` |
| `relevant_monsters` | `Which monsters fit this location and situation? Consider their CR.` |
| `magic_items` | `Items that connect to a character, a theme, or the story` |

`name`, `tooltip`, and `key` values for all 8 entries are unchanged. No other files change for this sub-feature.
