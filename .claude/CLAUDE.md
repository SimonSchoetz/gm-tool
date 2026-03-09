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

## /refactor

Intent: Execute refactoring steps under strict invariants for pacing, cleanup, and behavioral decisions
Input: A refactoring task or review output
Output: Step-by-step changes with confirmation gates between each step
Constraints: Treats its instructions as the single source of truth for all decisions

## /refine-instructions

Intent: Translate feedback into surgical CLAUDE.md changes
Input: Root cause summary from arch-review or direct observation
Output: Proposed changes with before/after, asks for approval before applying
Constraints: No wholesale rewrites, prescriptive language only; classifies every proposed instruction as RAIL or SIGN before drafting — pushes back if SIGN and a structural fix is feasible
