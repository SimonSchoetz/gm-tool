# SF5: MentionNode + MentionBadge format support

Gives `MentionNode` its own format storage — independent of Lexical's native `__format`, per the root spec's KAD "Formatting is a custom, parallel mechanism — not Lexical's native format pipeline" — and wires it through to `MentionBadge` as CSS modifier classes. Bundled as one sub-feature because splitting the node's new field from the badge's consumption of it would leave an intermediate, uncommittable state: `MentionNode.decorate()` must pass a `format` prop the moment the field exists, and `MentionBadge`'s `Props` type must accept it in the same change, or the sub-feature does not compile on its own.

## Files affected

**Modified:**

- `TextEditor/nodes/MentionNode.tsx`
- `TextEditor/components/MentionBadge/MentionBadge.tsx`
- `TextEditor/components/MentionBadge/MentionBadge.css`

**New:**

- `TextEditor/components/MentionBadge/helper/buildMentionTextDecoration.ts`
- `TextEditor/components/MentionBadge/helper/index.ts`
- `TextEditor/components/MentionBadge/helper/__tests__/buildMentionTextDecoration.test.ts`

**No change needed:** `TextEditor/nodes/index.ts` — currently `export * from './MentionNode'`. Verified against `app/src/CLAUDE.md`'s Barrel Files rule: `export *` in a module directory barrel is permitted when the file has a single, obvious public concern with no internals to leak. `MentionNode.tsx` exports only the node class, its serialized type, and (after this sub-feature) a type guard — all intended as public API; the new `convertMentionElement` (SF4) and this sub-feature's format-mutation logic stay as unexported locals, so nothing leaks. `export *` remains correct with no edit required.

## Layered breakdown

### Frontend — `TextEditor/nodes/MentionNode.tsx`

Add `TextFormatType` and `LexicalNode` to the existing `from 'lexical'` import (alongside the types SF4 already added).

Add a new field, extend the constructor, `clone`, `importJSON`, and `exportJSON`, and add two new members:

```ts
export type SerializedMentionNode = SerializedLexicalNode & {
  entityId: string;
  entityType: string;
  displayName: string;
  color: string;
  adventureId?: string;
  mentionFormats?: TextFormatType[];
};

export class MentionNode extends DecoratorNode<JSX.Element> {
  __entityId: string;
  __entityType: string;
  __displayName: string;
  __color: string;
  __adventureId: string | null;
  __mentionFormats: TextFormatType[];

  constructor(
    entityId: string,
    entityType: string,
    displayName: string,
    color: string,
    adventureId?: string | null,
    mentionFormats: TextFormatType[] = [],
    key?: NodeKey,
  ) {
    super(key);
    this.__entityId = entityId;
    this.__entityType = entityType;
    this.__displayName = displayName;
    this.__color = color;
    this.__adventureId = adventureId ?? null;
    this.__mentionFormats = mentionFormats;
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__entityId,
      node.__entityType,
      node.__displayName,
      node.__color,
      node.__adventureId,
      node.__mentionFormats,
      node.__key,
    );
  }

  static importJSON(json: SerializedMentionNode): MentionNode {
    return new MentionNode(
      json.entityId,
      json.entityType,
      json.displayName,
      json.color,
      json.adventureId ?? null,
      json.mentionFormats ?? [],
    );
  }

  exportJSON(): SerializedMentionNode {
    const json: SerializedMentionNode = {
      type: 'mention',
      version: 1,
      entityId: this.__entityId,
      entityType: this.__entityType,
      displayName: this.__displayName,
      color: this.__color,
    };
    if (this.__adventureId !== null) {
      json.adventureId = this.__adventureId;
    }
    if (this.__mentionFormats.length > 0) {
      json.mentionFormats = this.__mentionFormats;
    }
    return json;
  }

  getMentionFormats(): readonly TextFormatType[] {
    return this.__mentionFormats;
  }

  toggleMentionFormat(format: TextFormatType): this {
    const self = this.getWritable();
    self.__mentionFormats = self.__mentionFormats.includes(format)
      ? self.__mentionFormats.filter((f) => f !== format)
      : [...self.__mentionFormats, format];
    return self;
  }
}

export const $isMentionNode = (
  node: LexicalNode | null | undefined,
): node is MentionNode => node instanceof MentionNode;
```

`getMentionFormats`/`toggleMentionFormat` are deliberately not named `getFormat`/`setFormat`/`hasFormat`/`toggleFormat` — those names are reserved by Lexical's native `TextNode`/`ElementNode` format system (verified: `DecoratorNode` inherits none of them, per the root spec's KAD "Formatting is a custom, parallel mechanism — not Lexical's native format pipeline"), and reusing the names here would misleadingly imply compatibility with that system. `toggleMentionFormat` is consumed by SF6; `getMentionFormats` is consumed by SF6 and SF7 (the toolbar active-state check), and by SF5's own `decorate()` update below. `$isMentionNode` is consumed by SF6 and SF7 — both need to filter an arbitrary selection's nodes down to mentions. SF8 (`MentionBadge`'s live-resolution work) does not consume `$isMentionNode`: it already knows, by construction, that the node at its own `nodeKey` is a `MentionNode` (a node's class never changes after creation), so it narrows with a plain null-check against a type-only import instead — see SF8 for why a value import here would create a real circular module dependency between this file and `MentionBadge.tsx` that a type-only import avoids.

Update `decorate()` to pass the new prop:

```ts
decorate(): JSX.Element {
  return (
    <MentionBadge
      entityId={this.__entityId}
      entityType={this.__entityType}
      displayName={this.__displayName}
      color={this.__color}
      adventureId={this.__adventureId}
      format={this.__mentionFormats}
    />
  );
}
```

### Frontend — `TextEditor/components/MentionBadge/helper/buildMentionTextDecoration.ts` (new)

`underline` and `strikethrough` both map to CSS's `text-decoration` property; applying them as two independent modifier classes would have one clobber the other when both are active, since both set the same property. This helper computes the combined value:

```ts
import type { TextFormatType } from 'lexical';

export const buildMentionTextDecoration = (
  formats: readonly TextFormatType[],
): string => {
  const tokens: string[] = [];
  if (formats.includes('underline')) tokens.push('underline');
  if (formats.includes('strikethrough')) tokens.push('line-through');
  return tokens.length > 0 ? tokens.join(' ') : 'none';
};
```

This stays in `MentionBadge/helper/` rather than `/src/util/` — it is domain-coupled to the mention-format concern (fails the "generic, no domain coupling" util condition) and has exactly one consumer.

**`TextEditor/components/MentionBadge/helper/index.ts` (new)** — required module barrel for the `helper/` grouping folder, matching the existing single-function precedent in `EditorPopup/helper/index.ts` and `FloatingToolbar/components/LinkRow/helper/index.ts`:

```ts
export { buildMentionTextDecoration } from './buildMentionTextDecoration';
```

### Frontend — `TextEditor/components/MentionBadge/MentionBadge.tsx`

Add `format: TextFormatType[]` to `Props`, and `import type { TextFormatType } from 'lexical';`, `import { cn } from '@/util';`, `import { buildMentionTextDecoration } from './helper';`.

Update the destructured props and the returned `<span>`:

```tsx
export const MentionBadge: FCProps<Props> = ({
  entityId,
  entityType,
  displayName,
  color,
  adventureId,
  format,
}) => {
  // ...existing hooks and handlers, unchanged...

  return (
    <span
      ref={badgeRef}
      className={cn(
        'mention-badge',
        format.includes('bold') && 'mention-badge--bold',
        format.includes('italic') && 'mention-badge--italic',
      )}
      style={
        {
          '--rt-mention-pop-up-color': color,
          '--mention-badge-text-decoration': buildMentionTextDecoration(format),
        } as React.CSSProperties
      }
      onClick={handleClick}
      onMouseEnter={handleBadgeMouseEnter}
      onMouseLeave={handleBadgeMouseLeave}
    >
      {displayName}
    </span>
  );
};
```

Everything else in this file (hover-popup timers, `usePinnedPopups`, `handleClick`, the cleanup effect) is unchanged.

### Frontend — `TextEditor/components/MentionBadge/MentionBadge.css`

```css
.mention-badge {
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  color: rgb(var(--rt-mention-pop-up-color));
  text-decoration: var(--mention-badge-text-decoration, none);
}

.mention-badge--bold {
  font-weight: var(--font-weight-bold);
}

.mention-badge--italic {
  font-style: italic;
}
```

`--mention-badge-text-decoration` follows the Static CSS custom properties convention (`app/src/CLAUDE.md`): it is a JS-computed value, not DB-sourced, so it is prefixed `--mention-badge-` with no `rt-` segment.

## Test coverage

**`TextEditor/components/MentionBadge/helper/__tests__/buildMentionTextDecoration.test.ts` (new)** — required per the root Testing Policy (helper function with branching logic, no DOM/canvas-mutation exemption applies). Named tests:

- `'returns none when no formats are active'` — `buildMentionTextDecoration([])` → `'none'`
- `'returns underline when only underline is active'` — `buildMentionTextDecoration(['underline'])` → `'underline'`
- `'returns line-through when only strikethrough is active'` — `buildMentionTextDecoration(['strikethrough'])` → `'line-through'`
- `'combines both when underline and strikethrough are both active'` — `buildMentionTextDecoration(['strikethrough', 'underline'])` → `'underline line-through'` (asserts the output order is normalized regardless of input order)
- `'ignores formats that do not map to text-decoration'` — `buildMentionTextDecoration(['bold', 'italic'])` → `'none'`

`MentionBadge.tsx` itself gets no test — it is a component (its export returns JSX), and the root Testing Policy forbids component tests. `MentionNode.tsx`'s new methods follow SF4's stated absence of node-class test convention.
