# SF5 — AppearanceSection Wiring

Wire the existing `EnableButton` toggle in `AppearanceSection` to `useSetting('background')`.

## Files Affected

```
Modified: src/screens/settings/components/AppearanceSection/AppearanceSection.tsx
```

## Frontend

### Purpose

Replace the hard-coded `isEnabled={true}` and placeholder `console.log` in `AppearanceSection` with live reads and writes from the `background` setting.

### Behavior

- Add `import { useSetting } from '@/data-access-layer';` to the import list.
- Call `useSetting('background')` inside the component body:
  ```ts
  const { value, update } = useSetting('background');
  ```
- Replace `isEnabled={true}` with `isEnabled={value?.animation_enabled ?? true}`. Defaults to `true` during the loading window so the button appears enabled before the query resolves.
- Replace the `onClick` placeholder with:
  ```ts
  onClick={() => { update({ animation_enabled: !(value?.animation_enabled ?? true) }); }}
  ```
  This toggles the stored boolean. When `value` is `null` (loading), the toggle acts as if the current value is `true` (default on).

The `onClick` wrapper function is required — it contains a transformation (`!`) and cannot be inlined as a direct prop reference per the CLAUDE.md pass-props-directly rule.

### UI / Visual

No layout or style change. The `EnableButton` already has enabled/disabled visual states driven by its `isEnabled` prop. The `GlassPanel`, `label`, and CSS classes in `AppearanceSection.css` are unchanged.

### Cleanup

Remove the existing `onClick` arrow function containing `console.log('tbd: toggle bg animation settings')` — it is replaced entirely by the wiring above.
