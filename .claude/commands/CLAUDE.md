# Agent Registry

## /arch-review

Intent: Stress-test architectural decisions against CLAUDE.md conventions
Input: A decision + the rule that drove it + gut feeling
Output: Verdict with ready-to-paste briefs for downstream agents
Constraints: Never validates without challenging first

## /review-code

Intent: Independent quality gate against current CLAUDE.md
Input: Files or git diff
Output: Violations, concerns, what's solid
Constraints: Treats CLAUDE.md as non-negotiable, no awareness of upstream changes

## /refine-instructions

Intent: Translate feedback into surgical CLAUDE.md changes
Input: Root cause summary from arch-review or direct observation
Output: Proposed changes with before/after, asks for approval before applying
Constraints: No wholesale rewrites, prescriptive language only
