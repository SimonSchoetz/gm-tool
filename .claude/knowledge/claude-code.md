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

## Subagent name resolution is layered, with plugin agents at the lowest priority

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-01
**Citation:** [refine-claude_1: <https://code.claude.com/docs/en/sub-agents> — "When multiple subagents share the same name, Claude Code uses the one from the higher-priority location."]

The documented priority order is: managed settings (highest), the `--agents` CLI flag, `.claude/agents/` (project), `~/.claude/agents/` (user), then a plugin's `agents/` directory (lowest). Consequence: a globally distributed agent — whether user-scope or plugin-supplied — can be overridden for one project by placing a same-named file in that project's `.claude/agents/`, with no change to the global copy.

## Plugins bundle agents, commands, and skills at the plugin root, never inside `.claude-plugin/`

**Verified at:** <https://code.claude.com/docs/en/plugins> — 2026-09-01
**Citation:** [refine-claude_2: <https://code.claude.com/docs/en/plugins> — "Plugin structure overview" table and the "Common mistake" warning]

Only `plugin.json` goes in `.claude-plugin/`. `skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, and `settings.json` all sit at the plugin root. The `plugin.json` manifest is optional when components use these default locations. Plugin skills are namespaced as `/plugin-name:skill-name`, so migrating a standalone `.claude/commands/x.md` into a plugin changes its invocation from `/x` to `/plugin-name:x`.

## A skills-directory plugin auto-loads from `~/.claude/skills/<name>/` with no marketplace or install step

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-01
**Citation:** [refine-claude_3: <https://code.claude.com/docs/en/plugins-reference> — "Skills-directory plugins"; scaffolded by `claude plugin init <name>` per <https://code.claude.com/docs/en/plugins> — "Develop a plugin in your skills directory"]

Any folder under a skills directory containing a `.claude-plugin/plugin.json` manifest loads on the next session as a plugin named `<name>@skills-dir`. Personal scope (`~/.claude/skills/`) loads in every project with no trust restrictions; project scope (`.claude/skills/`) loads only after workspace trust, resolves only from the session's primary working directory rather than walking up to the repo root, and never loads background monitors. Edits to a `SKILL.md` take effect immediately; changes to agents, hooks, or MCP servers need `/reload-plugins`. Removal is `claude plugin disable <name>@skills-dir` or deleting the folder — there is no uninstall step.

## Project-scope plugin installs are recorded in the repository's own `.claude/settings.json`

**Verified at:** <https://code.claude.com/docs/en/discover-plugins> — 2026-09-01
**Citation:** [refine-claude_4: <https://code.claude.com/docs/en/discover-plugins> — "Install plugins" scope list, and "Configure team marketplaces"]

Install scopes are user (all of your projects), project ("install for all collaborators on this repository, which adds the plugin to `.claude/settings.json`"), and local (this repository, not shared). A project's `.claude/settings.json` registers the catalog via `extraKnownMarketplaces` and declares the plugin via `enabledPlugins`, so the repository itself records which workflow bundle it depends on without vendoring the definition files. A marketplace source may be a private git repository, and `/plugin marketplace add <url>#<ref>` pins it to a branch or tag.

## Plugin content resolves three path variables, including a plugin-root anchor

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-01
**Citation:** [refine-claude_5: <https://code.claude.com/docs/en/plugins-reference> — path substitution variable table]

`${CLAUDE_PLUGIN_ROOT}` resolves to the plugin's installation directory, `${CLAUDE_PLUGIN_DATA}` to a persistent per-plugin directory surviving updates, and `${CLAUDE_PROJECT_DIR}` to the project root. All three substitute inside skill and agent content, not only hook and MCP configs — so a plugin-supplied agent can point at a bundled reference file via `${CLAUDE_PLUGIN_ROOT}` and at per-project data via `${CLAUDE_PROJECT_DIR}`.

## Filesystem access is scoped to the launch directory, extended by `additionalDirectories`

**Verified at:** <https://code.claude.com/docs/en/permissions> — 2026-09-01
**Citation:** [refine-claude_6: <https://code.claude.com/docs/en/permissions> — "Working directories": "By default, Claude has access to files in the directory where you launched it"; "Files in additional directories follow the same permission rules as the original working directory"]

Out-of-project reads and writes are not available by default. Access is extended by `--add-dir <path>`, the `/add-dir` command, or `permissions.additionalDirectories` in any settings file — including user-level `~/.claude/settings.json`, which extends every project on that machine. Once added, those paths carry the same permission rules as the working directory, so the cost is one-time configuration rather than per-operation friction.

## `permissions.additionalDirectories` grants file access only — `--add-dir` also loads configuration

**Verified at:** <https://code.claude.com/docs/en/permissions> — 2026-09-01
**Citation:** [refine-claude_7: <https://code.claude.com/docs/en/permissions> — "Additional directories grant file access, not configuration": "Directories listed in `permissions.additionalDirectories` in a settings file grant file access only and don't load any of the configuration below"]

Directories added via the `--add-dir` flag or `/add-dir` command additionally load skills (`.claude/skills/`, live reload), command files (`.claude/commands/`, no live reload — the project's own command wins on a name collision), and subagents (`.claude/agents/`, no live reload); `.claude/settings.json` contributes only `enabledPlugins` and `extraKnownMarketplaces` from such a directory, and CLAUDE.md files load only when `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` is set. The settings-file key grants none of this. Consequence: a settings-file entry is the right choice for a pure data directory, while `--add-dir` is what makes an external directory's agents and commands loadable.

## A plugin's `commands/` entries are skills, and plugin skills are always namespaced

**Verified at:** <https://code.claude.com/docs/en/plugins> — 2026-09-01
**Citation:** [refine-claude_12: <https://code.claude.com/docs/en/plugins> — structure table `commands/` row ("Skills as flat Markdown files. Use `skills/` for new plugins"); namespacing note ("Plugin skills are always namespaced (like `/my-first-plugin:hello`) to prevent conflicts when multiple plugins have skills with the same name"); reload-summary text ("In the skills count, Claude Code includes every skill a plugin provides: both its `commands/` entries and its `SKILL.md` skills")]

The documentation does not state in one sentence whether a `commands/*.md` file gains the `plugin-name:` prefix. It is established by chaining two direct statements — `commands/` entries are skills, and plugin skills are always namespaced — so a `commands/` entry is namespaced. Recorded as a two-premise chain rather than a direct quotation, because no single passage asserts it. The question is avoidable in practice: the same table directs "Use `skills/` for new plugins," and namespacing for the `skills/` layout is stated outright. A WebFetch summary of the plugins-reference page claimed the opposite (that commands stay unprefixed) while quoting text about skills directory structure that did not address commands at all — that answer was an inference presented as a quotation and should not be relied on.

## `name` is the only required field in a plugin manifest

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-01
**Citation:** [refine-claude_23: <https://code.claude.com/docs/en/plugins-reference> — plugin manifest schema: "If you include a manifest, `name` is the only required field"; `name` must be "Unique identifier in kebab-case, with no spaces, control characters, or bidirectional-formatting characters"]

Every other manifest field is optional: `displayName`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `metadata`, `skills`, `commands`, `agents`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `experimental`, and `dependencies`. The manifest itself is optional when components sit in their default locations. Note the interaction with version management: when `version` is set, marketplace users receive updates only when it is bumped.

## `/reload-plugins` does not discover a newly created plugin folder — that needs a restart

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-01
**Citation:** [refine-claude_24: <https://code.claude.com/docs/en/plugins-reference> — skills-directory plugin discovery; `/reload-plugins` applies to already-discovered plugins, while a new plugin folder requires restarting Claude Code]

`/reload-plugins` re-reads components of plugins Claude Code has already discovered — a change to `hooks/`, `.mcp.json`, `agents/`, or `output-styles/` is picked up by it. A `SKILL.md` edit takes effect immediately with no command at all. But creating a brand-new folder under a skills directory is a discovery event, not a reload event: the plugin loads on the next session start. Consequence for any first-time plugin install via the skills-directory mechanism: plan for a session restart rather than assuming `/reload-plugins` suffices.

## `${CLAUDE_PLUGIN_ROOT}` substitutes anywhere it appears in skill and agent content

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-02
**Citation:** [refine-claude_31: <https://code.claude.com/docs/en/plugins-reference> — path substitution table, resolution scope for skill and agent content given as "Anywhere the placeholder appears," with no conditional distinguishing direct invocation from Task-tool-spawned invocation]

The variable is not limited to hook commands and MCP/LSP configs; it resolves inside the prose body of a `SKILL.md` or an agent definition, which makes it the correct way for a plugin file to reference a sibling file in the same plugin. A prose reference such as "this plugin's `reference/x.md`" gives the reading instance no anchor and resolves only by accident of the working directory. Related caveat, which does *not* apply to this case: after a mid-session plugin update, hook commands, monitors, MCP servers, and LSP servers keep resolving to the previous installation path until `/reload-plugins` runs. Skill and agent content is absent from that stale-path list — an absence that suggests fresh resolution per invocation but is not stated outright, so treat the per-invocation freshness as inferred rather than documented.
