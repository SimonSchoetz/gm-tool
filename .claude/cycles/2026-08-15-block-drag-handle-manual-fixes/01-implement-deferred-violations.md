# Deferred Violations — block-drag-handle manual-fix-mode review loop

Cycle 1, branch `feat/block-drag-handle`, review scope: full manual-fix-mode arc (commits `9b2d34f4`, `4e929c1e`, `21619ff7`, range `f47337e0..HEAD`).

code-reviewer flagged three CLAUDE.md violations. architect determined all three are real, valid findings but out of scope for the review loop's fix mandate — the loop only raises architectural findings (structure, layer boundaries, ownership, inter-layer contracts), never implementation-detail convention violations. All three are style/formatting conventions, not architectural. Each requires its own explicit disposition (fix now / accept as tracked debt / route to `/refine-claude`) — none is closed by being listed here.

## 1. `BlockDragHandlePlugin` not typed `FCProps<Props>`

**Source:** code-reviewer, cycle 1.
**Location:** `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/BlockDragHandlePlugin.tsx:6-10`.
**Finding:** `Props` is declared and the component takes a closed prop set (`anchorElem: HTMLElement`) — case 3 under `app/src/CLAUDE.md`'s Props pattern. Case 3 requires `FCProps<Props>`; the component is instead a bare-typed arrow function. Newly introduced in this arc (the pre-arc version took no props at all).
**Why out of scope:** architect classified this as intra-component typing style (same CLAUDE.md section as the `cn()`-usage example named as the canonical out-of-scope case for this loop), not a structural/layer/ownership finding.

## 2. `onElementChanged` wrapped in a pass-through inline function

**Source:** code-reviewer, cycle 1.
**Location:** `app/src/components/TextEditor/plugins/BlockDragHandlePlugin/BlockDragHandlePlugin.tsx:35-37`.
**Finding:** `onElementChanged={(element) => { setHoveredElement(element); }}` forwards its single argument unchanged with no transformation, guard, renaming, or ESLint-required adapter. Verified type-compatible: `setHoveredElement` (`Dispatch<SetStateAction<HTMLElement | null>>`) is directly assignable to `onElementChanged`'s `(element: HTMLElement | null) => void` by parameter contravariance. Violates `app/src/CLAUDE.md`'s Component Internals rule against pass-through prop wrappers.
**Why out of scope:** same CLAUDE.md section, same style-not-structure classification as #1.

## 3. `Cargo.toml` comment split mid-sentence across two lines

**Source:** code-reviewer, cycle 1.
**Location:** `app/src-tauri/Cargo.toml:11-13`.
**Finding:** Lines 11-12 are one sentence manually split across two `#` comment lines, violating root CLAUDE.md's "never introduce manual line breaks within a single logical unit — a code comment anywhere in the codebase." Predates this arc's diff (this arc's only Cargo.toml change is line 18's `features = []` removal), but the file was touched, and root CLAUDE.md's "fix violations in files you touch" rule requires fixing every violation found in a touched file in the same edit pass.
**Why out of scope:** architect confirmed the citation logic (predates-branch does not exempt it) is correct, but excluded it anyway on the same category basis as #1/#2 — a comment-formatting rule is stylistic, not architectural.

---

## Disposition

User disposition: fix all three now. All three fixed in commit `cfbb98aa` (`fix(block-drag-handle): resolve deferred review-loop violations`).

The related concern (reset.css `max-width: 100%` removal, not a violation) was also disposed in the same commit: user chose to keep the removal and document the rationale with a comment, rather than revert it.
