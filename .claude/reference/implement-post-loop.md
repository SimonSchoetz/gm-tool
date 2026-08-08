# Implement — Post-Loop Advisory Scans and Handoff Artifact Content

## Post-loop advisory scans

Run the following three post-loop advisory scans. Each produces a non-blocking advisory, distinct from the friction brief, deferred violations brief, and spec quality brief — the user decides what to do with each finding, never you. Never route any of their output through architect or code-reviewer, and never commit anything based on any of them.

- **Raw CSS values**: run `git diff --name-only main...HEAD` for the touched-file list, then scan each `.css` file for raw property values (colors, spacing, border radii, shadows, font sizes) with no `/* one-off */` annotation on the same line or the line immediately preceding. Label: "Raw CSS values to review — not violations; you decide: add a design token, add `/* one-off */`, or leave as-is."
- **Long-living reference currency**: for each doc `app/docs/CLAUDE.md` designates as a long-living infrastructure reference that must not be deleted after implementation (currently: `app/docs/_product/domain-scaffold.md`), reuse the touched-file list above; strip the leading `app/` from each touched path (the reference doc's own text names paths relative to `app/`, not repo root) and grep the reference doc for each resulting path as a literal string. If any match exists and the reference doc itself is not in the touched-file list, flag it. Label: "Long-living reference doc paths touched — not a violation; verify the referenced section still reflects this branch's change."
- **Manual-verification risk**: grep the spec file(s) for this branch for the literal marker `[MANUAL-VERIFY]` (added by spec-writer's Untested residual risk gate). Label: "Manual verification required — not violations; these interactions are exempt from automated tests by Testing Policy and were not otherwise exercised. Verify by hand before considering the branch ready."

## Friction brief content

This step runs only when friction occurred during the session or when non-blocking instruction gaps were surfaced during the review loop.

Produce a friction summary covering:

**Implementation friction** (if any):

- Every friction event: what happened, which phase it occurred in, how it was resolved
- The source of each friction event: was it a gap in an agent/command definition, a reasoning error, or a missing CLAUDE.md rule?
- Any decision made under ambiguity — what the question was, what was chosen, why

**Process gaps identified during manual fix mode** (if any):

- Every process gap identified while diagnosing or fixing a bug during manual fix mode
- For each: the phase it occurred in, whether the gap is scoped to the manual-fix-mode loop specifically or reflects a general reasoning/process principle, and the candidate owner file or domain for the fix
- At least one contrast entry — a correct diagnosis or a clean fix reached under comparable conditions — when one occurred during the session; do not leave inclusion to author discretion

**Instruction gaps** (if any):

- Every instruction gap the code-reviewer surfaced that was not blocking the current task (blocking gaps were handled by architect in the review loop)
- For each: what rule is missing or ambiguous, and in which file or context it was observed

**Concerns** (if any):

- Every concern the architect raised during the review loop that was not fixed on this branch
- For each: what the concern is, which file or construct it applies to, and why it was not fixed (non-blocking by definition — concerns never block loop exit)

Output the summary to the user. This is the handoff artifact for a future `/refine-claude` session.

## Spec quality brief content

This step always runs at the end of the session, regardless of whether friction occurred.

Produce a spec quality summary covering:

**Over-specified** (if any): sections where the spec reproduced derivable content in full — file bodies that were pure name substitution, test structure descriptions the implementer re-derived from source files anyway. Name the specific sections.

**Under-specified or wrong** (if any): gaps that caused friction — missing implementation-time details, incorrect claims about generated files, missing tsc-blocker annotations for cross-SF dependencies. Name the specific gaps and what the spec should have said.

**Decisions vs. substitutions** — for each file group in the spec, classify: was the spec content a decision (non-obvious choice the implementer could not derive), a substitution (name-only change from a reference), or mixed? This is the raw material for spec-writer improvement.

**Format observations** (if any): structural suggestions — sections that could have been shorter, sections that were missing, ordering that caused friction.

Output the summary to the user. This is the handoff artifact for a `/refine-claude` session focused on spec-writer improvement.
