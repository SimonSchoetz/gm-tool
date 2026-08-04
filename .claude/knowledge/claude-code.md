# Claude Code

## Subagent `tools:` frontmatter accepts whole tool names only — no command-scoped grants

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_1: <https://code.claude.com/docs/en/sub-agents> — "Supported frontmatter fields" table, `tools` row, and the "Restrict tools" example]

The `tools` field is documented as "Tools the subagent can use. Inherits every tool available to subagents if omitted." Its documented example is `tools: Read, Grep, Glob, Bash` — a comma-separated list of whole tool names. No command-scoped or parameter-scoped form (e.g. `Bash(wc:*)`) appears anywhere in the field's specification or examples, so granting `Bash` to a subagent grants the entire tool, not a subset of shell commands.

## Command-scoped permission rules live in the permissions layer and apply session-wide, not per-subagent

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_2: <https://code.claude.com/docs/en/sub-agents> — plugin-subagent Note under "Choose the subagent scope"]

Scoped rules of the `Bash(git *)` form belong to `permissions.allow` / `permissions.deny` in `settings.json`, a different mechanism from subagent frontmatter. The documentation states these "rules apply to the entire session, not only the plugin subagent." Consequence: a scoped Bash grant cannot be used to give one subagent a narrow shell capability without also affecting the main thread and every other subagent in the session.

## `disallowedTools` is the denylist counterpart to `tools`

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-08-04
**Citation:** [C_3: <https://code.claude.com/docs/en/sub-agents> — "Supported frontmatter fields" table, `disallowedTools` row]

`disallowedTools` is documented as "Tools to deny, removed from inherited or specified list." It subtracts whole tools from the inherited pool and offers no finer granularity than `tools`, so it cannot narrow a tool's internal surface either.
