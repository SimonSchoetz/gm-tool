# Session Screen refactor user stories

## Screen title component

As a developer, I want a single screen title component so can I maintain it easier and make sure the title works and feels the same on every screen.

### AC

- Session Header input should feel and look exactly like adventure screen title input and npc screen input

### Note

- spec writer and implementer did not see that there is a `Input` component

## Global font color default

As a developer, I want font colors to have global default so I only have to define colors in edge cases like error or warning messages, ect.

### AC

- `var(--color-fg)` as default
- should also apply to all icons
