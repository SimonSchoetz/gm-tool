# SPEC: [ComponentName]

--- **Delete this section after reading to keep Claude focused START**

## How to use this document

- Don't over-specify - leave room for implementation decisions
- Reference existing patterns in the codebase when possible
- Focus on the "what" and "why", not the "how"
- --- **Delete this section after reading to keep Claude focused END**

## Before anything else

Reade all CLAUDE.md files!

## Purpose

Brief description of what this component does and why it exists.

Example:

> Display adventure summary in a clickable card format on the adventures list screen.

## Location

Where this component will live in the codebase.

Example:

> `src/components/AdventureCard/`
> or
> `src/screens/adventures/components/AdventureCard/`

## Props / API

```typescript
type ComponentNameProps = {
  // Define the component's interface
  // Use types (not interfaces) per project conventions
};
```

Use the generic HtmlProps from `@/types` when typing the component

## Behavior

### User Interactions

- What happens on click, hover, focus, etc.
- Keyboard navigation if applicable

### State Management

- What state does the component manage?
- What side effects occur? (API calls, navigation, etc.)

### Edge Cases

- Loading states
- Error handling
- Empty/null data
- Validation rules

## UI / Visual Design

### Layout

Describe the visual structure.

### Styling Notes

- Reference existing components for consistency
- Note any specific colors, spacing, or effects
- Mention responsive behavior if relevant

Example:

> Use `GlassPanel` component as wrapper
> Follow card pattern similar to `SessionCard.css`
> Hover: glass effect with primary color glow

## Examples / User Flows

```text
User does X → Component responds with Y → Result is Z
```

Example:

```text
User clicks card → Navigate to adventure detail screen → Show adventure form
User hovers card → Glass panel glows → Shows interactive feedback
```

## Related Components

List any existing components this relates to, extends, or replaces.

Example:

> - Uses: `GlassPanel`, `Button`
> - Similar to: `SessionCard`
> - Replaces: N/A
