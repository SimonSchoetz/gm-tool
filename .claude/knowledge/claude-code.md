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

---
**Reverified at:** <https://code.claude.com/docs/en/plugins-reference> and <https://code.claude.com/docs/en/plugin-marketplaces> — 2026-09-08
**Citation:** [claude_1: <https://code.claude.com/docs/en/plugins-reference> — "Plugin caching and file resolution": "Claude Code copies *marketplace* plugins to the user's local **plugin cache** (`~/.claude/plugins/cache`) rather than using them in place, except for `command` sources in link mode"; "Skills-directory plugins": "Unlike a copied marketplace install, the plugin is discovered in place rather than copied into the plugin cache"; <https://code.claude.com/docs/en/plugin-marketplaces>: "Copied plugins can't reference files outside their directory using paths like `../shared-utils`, because those files won't be copied" — quoted by refute-harness S2 from the stress-test evidence file, `43-claude-boundary-stress-test-evidence.md:921-922`]

Unchanged as to the settings keys; qualified as to what a recorded install delivers. A marketplace install — the only kind `enabledPlugins` records — copies the plugin directory into a per-version directory under `~/.claude/plugins/cache`, so a tracked relative symlink that leaves the plugin directory (`rules → ../rules`, `projects → ../projects`) points at a nonexistent sibling of the cache copy and every `${CLAUDE_PLUGIN_ROOT}/rules/…` or `${CLAUDE_PLUGIN_ROOT}/projects/…` path dangles there. A plugin built on such symlinks is usable only through the in-place skills-directory install of the preceding entry, which no settings file records.

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

## In the desktop app's Code tab, spawned agents are one-shot: no `SendMessage` tool is exposed and `ListAgents` does not list them

**Verified at:** Claude desktop app, Code tab, session tool roster — 2026-09-04
**Citation:** [refine-claude_1: `ToolSearch select:SendMessage` → "No matching deferred tools found", checked before and after spawning an agent; the Agent tool's own result text still says "use SendMessage with `to: '<id>'`"; `ListAgents` returned only peer sessions, not the spawned agent]

The Agent tool result advertises `SendMessage` for continuing a spawned agent, but the tool is absent from both the loaded and the deferred tool lists in this environment, and a completed agent is not addressable afterwards. A protocol that needs resumable teammates must re-spawn with prior output as context. Re-check at session start; the same absence was observed on 2026-09-04 in the preceding cycle's session.

## The Read tool resolves `..` lexically, so a path through a symlink and then up one level does not reach the symlink target's parent

**Verified at:** Claude desktop app, Code tab — 2026-09-04
**Citation:** [refine-claude_2: Read on `/Users/simonschoetz/.claude/skills/devloop/../projects/CLAUDE.md` → "File does not exist", while `ls` on the same path lists the file at `~/dev/setup/claude/projects/CLAUDE.md`; first observed by head-of-instructions the same day, reproduced by the coordinator]

`${CLAUDE_PLUGIN_ROOT}/../<path>` is therefore not a usable pointer form from a symlink-installed plugin: the Read tool normalises `..` against the symlink's own directory (`~/.claude/skills/`), not its physical target. A file outside the plugin directory must be cited by a path that does not pass upward through the symlink.

## The Read tool follows a relative symlink placed inside a symlink-installed plugin directory

**Verified at:** Claude desktop app, Code tab — 2026-09-04
**Citation:** [refine-claude_3: scratch replica — `home/skills/devloop` → absolute symlink to `setup/claude/devloop`; inside it `projects` → relative symlink `../projects`; Read on `home/skills/devloop/projects/CLAUDE.md` returned the file's content]

A path with no `..` segment that passes through two symlinks in sequence resolves for the Read tool. So a tracked relative symlink `claude/devloop/projects → ../projects` makes `${CLAUDE_PLUGIN_ROOT}/projects/<path>` resolve from a plugin installed at `~/.claude/skills/devloop`, where `${CLAUDE_PLUGIN_ROOT}/../projects/<path>` does not (see the preceding entry).

---
**Reverified at:** Claude desktop app, Code tab — 2026-09-04, live install
**Citation:** [refine-claude_5: after creating the tracked symlink `claude/devloop/projects` → `../projects`, Read on `/Users/simonschoetz/.claude/skills/devloop/projects/CLAUDE.md` returned the format authority's content]

Unchanged.

## The Grep tool traverses a symlinked directory; the Glob tool does not

**Verified at:** Claude desktop app, Code tab — 2026-09-04
**Citation:** [refine-claude_4: on the scratch replica of the preceding entry, Grep with `path` set to `.../skills/devloop/projects` (a relative symlink) found `gm-tool/retro-log.md` beneath it; Glob with the same `path` and pattern `*/retro-log.md` returned no matches]

A plugin instruction that must find files under `${CLAUDE_PLUGIN_ROOT}/projects/` should say "grep", not "glob"; a Glob-based search through that symlink returns nothing without error.

## A skill's supporting files load only when Claude reads them; the skill body loads on invocation, not at session start

**Verified at:** <https://code.claude.com/docs/en/skills> — 2026-09-04
**Citation:** [refine-claude_6: "Unlike CLAUDE.md content, a skill's body loads only when it's used"; "Add supporting files" — "letting Claude access detailed reference material only when needed. Large reference docs … don't need to load into context every time the skill runs"; "Reference supporting files from `SKILL.md` so Claude knows what each file contains and when to load it"]

Nothing under a skill directory other than `SKILL.md` is loaded automatically; a supporting file reaches context only through a Read the agent performs. The only eager form documented is an `@` file reference in a local skill's body, which Claude Code attaches at invocation ("doesn't attach the files that `@` references name the way it does for a local skill" is listed as a cloud-session limitation). A plain path in backticks is not an `@` reference and stays lazy.

## A subagent starts with its agent file, the CLAUDE.md hierarchy, a git-status snapshot, and any skills named in its `skills` field; every other file must be read with a tool

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_7: "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read"; initial context lists system prompt (the agent's own prompt plus environment details), task message, CLAUDE.md files at every level the main conversation loads, git status, and "Preloaded skills: full content of any skill named in the agent's `skills` field"]

Reference helpers under a plugin's `reference/` are not in any of those categories, so a spawned agent holds a helper only after it follows a pointer and reads it.

## Claude Code's documented size targets: a CLAUDE.md under 200 lines, a SKILL.md body under 500 lines

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices> — 2026-09-04
**Citation:** [refine-claude_8: memory page, "Write effective instructions" — "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence"; "Keep it to facts Claude should hold in every session … If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule instead"; "imported files still load and enter the context window at launch"; skill best-practices page, "Token budgets" — "Keep SKILL.md body under 500 lines for optimal performance. If your content exceeds this, split it into separate files"]

Both limits are stated in lines, not characters, and the stated rationale is adherence (attention across competing instructions), not a hard loader limit: Claude Code loads a CLAUDE.md of up to 4 MiB in full. No size guidance is given for a skill's supporting files or for agent files; the skills guidance says reference files "don't consume context tokens until actually read".

## Skill supporting files: keep references one level deep, add a table of contents past 100 lines, and pull repeatedly-read files back inline

**Verified at:** <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices> — 2026-09-04
**Citation:** [refine-claude_9: "Avoid deeply nested references" — "Claude may partially read files when they're referenced from other referenced files … might use commands like `head -100` to preview content rather than reading entire files"; "Keep references one level deep from SKILL.md"; "For reference files longer than 100 lines, include a table of contents at the top"; "Observe how Claude navigates Skills" — "**Overreliance on certain sections:** If Claude repeatedly reads the same file, consider whether that content should be in the main SKILL.md instead"; "**Ignored content:** If Claude never accesses a bundled file, it might be unnecessary or poorly signaled"]

A supporting file reached only through another supporting file risks a partial read; a file the skill reads on every run is a candidate to move back inline; a file never read is a candidate to delete.

## User-level rules in `~/.claude/rules/` load at launch, concatenate with every other instruction file, and are recommended one topic per file

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_10: "Personal rules in `~/.claude/rules/` apply to every project on your machine"; "User-level rules are loaded before project rules, giving project rules higher priority"; "Rules without `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`"; "All `.md` files are discovered recursively"; "Each file should cover one topic, with a descriptive filename"; "All discovered files are concatenated into context rather than overriding each other"; "if two rules contradict each other, Claude may pick one arbitrarily"]

Priority means load order only; nothing overrides anything, and a contradiction between two loaded rules has no deterministic winner. Splitting one file into several unscoped rules files changes nothing about what a session holds at launch; only a `paths` frontmatter makes a rule load on demand. The relative load order between `~/.claude/CLAUDE.md` and `~/.claude/rules/` is not stated.

## Rules directories support symlinks for sharing; a symlinked user-level rules directory is skipped in Cowork desktop sessions

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_11: "The `.claude/rules/` directory supports symlinks, so you can maintain a shared set of rules and link them into multiple projects. Symlinks are resolved and loaded normally, and circular symlinks are detected and handled gracefully" with the example `ln -s ~/shared-claude-rules .claude/rules/shared`; Cowork caveat: "it also skips a `~/.claude/CLAUDE.md` that is itself a symlink or hard link, and a symlinked `~/.claude/rules/` directory or rule file that points outside the working directory"]

Symlink support is stated for the project-scope directory and implied for the user-scope one by the Cowork caveat, which presupposes a symlinked `~/.claude/rules/` directory can exist; it is not stated directly for `~/.claude/rules/`. Subdirectory `CLAUDE.md` files are included "when Claude reads files in those subdirectories", not at launch; nothing is stated about `~/.claude/rules/` after `/compact`.

## An instance can tell when Auto mode is active: the harness injects a "While auto mode is active" instruction block into its context

**Verified at:** Claude desktop app, Code tab — 2026-09-04
**Citation:** [refine-claude_12: the coordinator's own system context in this session carries a block beginning "While auto mode is active:" that changes tool preferences; no such block would be present in Manual mode]

A rule conditioned on "when the session is not in Auto mode" therefore has an observable trigger: the presence or absence of that block. Observed in one harness build; re-check if the block's wording changes.

## A subagent's initial context includes project rules; user-level `~/.claude/rules/` is not named

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_13: "CLAUDE.md files: every level of the CLAUDE.md hierarchy the main conversation loads, including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, and managed policy files. The built-in Explore and Plan agents skip this." — where the memory page names `.claude/rules/` as "project rules"]

`.claude/rules/` files reach a spawned agent; whether `~/.claude/rules/` files do is not stated. A plugin citation that must resolve for a spawned agent should therefore not rely on a user-level rules file being in that agent's context; a path the agent can Read does not depend on it.

## `claudeMdExcludes` skips instruction files by absolute-path glob at any settings layer, and matches a symlinked rules file by either path from v2.1.239

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_14: "Exclude specific CLAUDE.md files" — "Patterns are matched against absolute file paths using glob syntax. You can configure `claudeMdExcludes` at any settings layer: user, project, local, or managed policy. Arrays merge across layers"; "To exclude a rules file you reach through a symlink … write the pattern against either path … Before v2.1.239, only a pattern that matched the link target excluded the file"; "Managed policy CLAUDE.md files cannot be excluded"; first observed by head-of-instructions, cited from the same page]

The documented way to switch off one shared rules file for one machine or project without contradicting it; a whole rules directory is excluded with a `/…/.claude/rules/**` pattern.

## A plugin-root `rules/` directory has no meaning to the loader, and a plugin-root `CLAUDE.md` is not loaded as project context

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-04
**Citation:** [refine-claude_15: documented plugin-root entries are `.claude-plugin/`, `skills/`, `commands/`, `agents/`, `workflows/`, `output-styles/`, `themes/`, `hooks/`, `.mcp.json`, `.lsp.json`, `monitors/`, `bin/`, `settings.json`, `scripts/`, `LICENSE`, `CHANGELOG.md`; "A `CLAUDE.md` file at the plugin root is not loaded as project context"; first observed by head-of-instructions, cited from the same page]

A tracked symlink `claude/devloop/rules → ../rules` is inert to the plugin loader: the shared rules load once, through `~/.claude/rules/shared`, and the symlink only makes `${CLAUDE_PLUGIN_ROOT}/rules/<file>.md` a readable path.

## A user-level rules file with `paths` frontmatter loads on demand, like a project rule, not at launch

**Verified at:** <https://code.claude.com/docs/en/memory> (Path-specific rules; silent on user scope) + observation 2026-09-07
**Citation:** [refine-claude_1: ran a fresh session in gm-tool with `~/.claude/rules/paths-test.md` carrying `paths: ["**/*.tsx"]` and a marker instruction — marker unknown at launch and before any file read; after reading `app/src/App.tsx` the session answered the marker and described the file; in a second session the same file loaded when a message merely referenced a `.tsx` path]

A file under `~/.claude/rules/` (including one reached through the `~/.claude/rules/shared` symlink) with `paths` frontmatter is not loaded at launch and does not appear in the launch-time instruction set; it loads when the session reads or references a file matching the glob. So a stack-specific shared rule costs nothing in a session that never touches that stack. The docs document `paths` only under `.claude/rules/`; this entry is the user-scope evidence.

## `disable-model-invocation: true` removes a skill's description from the model's skill listing and blocks model invocation; the skill stays user-invocable

**Verified at:** <https://code.claude.com/docs/en/skills> — 2026-09-08
**Citation:** [claude_2: <https://code.claude.com/docs/en/skills> — invocation-control table row "`disable-model-invocation: true` | Yes | No | Description not in context, full skill loads when you invoke"; frontmatter table: "Set to `true` to prevent Claude from automatically loading this skill … Also prevents the skill from being preloaded into subagents"; "If you set `disable-model-invocation: true`, Claude can't run the skill automatically" (refute-harness_13: `grep -n -B2 -A6 disable-model-invocation` on the fetched page); confirmed on this machine: the coordinating session's own skill listing named other plugins' skills by namespace (`anthropic-skills:docx`, `cowork-plugin-management:cowork-plugin-customizer`, …) and no `devloop:*` skill while the devloop plugin was installed and loading, every devloop skill carrying the flag (refute-harness_15)]

A skill with the flag is neither described to the model nor invocable by it, and it cannot be preloaded through a subagent's `skills` field; the user invokes it with `/name`, and only then does its body load. Consequence: "a skill namespaced `<plugin>:` appears in the session's skill listing" is not a test for whether that plugin is installed when its skills carry the flag — the listing is empty for such a plugin even though it loads and its skills run on user invocation.

## `${CLAUDE_PLUGIN_ROOT}` is not substituted in files reached by the Read tool — only in skill and agent content, hook and monitor commands, and MCP/LSP fields

**Verified at:** <https://code.claude.com/docs/en/plugins-reference> — 2026-09-08
**Citation:** [claude_3: <https://code.claude.com/docs/en/plugins-reference> — path substitution table, whose rows are "Skill and agent content", "Hook and monitor commands", MCP `stdio` servers, MCP `http`/`sse`/`ws` servers and LSP servers, with no row for supporting or reference files; observed live: Read on `/Users/simonschoetz/.claude/skills/devloop/reference/run-pre-emission-compliance-pass.md` at offset 29 returned the literal string `${CLAUDE_PLUGIN_ROOT}/agents/spec-writer.md`, unsubstituted (refute-harness_16)]

A helper under a plugin's `reference/` reaches context only through a Read, and Read returns the file's bytes, so a `${CLAUDE_PLUGIN_ROOT}` token inside it stays literal; the reader resolves it against the plugin root its own skill or agent content received, and a reader with no such anchor — a session that did not enter through a plugin skill or agent, or a helper handed over by bare path — has nothing to resolve it with. This qualifies the earlier entry "substitutes anywhere it appears in skill and agent content": that scope is exact, and reference files lie outside it.

## A symlink at `~/.claude/skills/<name>` to a plugin directory outside `~/.claude` is followed by the loader

**Verified at:** Claude desktop app, Code tab — 2026-09-08
**Citation:** [claude_4: observational — the docs leave symlink handling under a skills directory unstated; gm-tool's `.claude/commands/` and `.claude/agents/` were deleted in `20d75d8b` (`git log --diff-filter=D --format='%h %ad %s' --date=short -- .claude/commands .claude/agents` — observed `20d75d8b 2026-09-02 refactor(workflow-globalization): remove definitions now supplied by the plugin`, refute-harness_5); the symlink `~/.claude/skills/devloop → /Users/simonschoetz/dev/setup/claude/devloop` was created 2026-09-02 (`stat -f '%SB' ~/.claude/skills/devloop` — `2026-09-02`, refute-harness_6); `13-refine-claude-proposals.md` and `41-refine-claude-step2-proposals.md` were written by the `refine-claude` role on 2026-09-07 (`stat` — `2026-09-07 15:31`, `2026-09-07 20:31`, refute-harness_7) when no `refine-claude` definition existed in the project]

The only source of the `refine-claude` role on those dates was the plugin behind the symlink, so the skills-directory loader follows an absolute symlink whose target lies outside `~/.claude` and discovers the plugin in place there, where its tracked relative symlinks (`rules → ../rules`, `projects → ../projects`) resolve against the real directory. Documentation states nothing about symlinks under a skills directory; this entry is observational and holds for the harness build in use on 2026-09-07. It is the one install route under which the plugin's out-of-directory symlinks work (see the reverification on the project-scope-install entry above).

## Subdirectory `CLAUDE.md` loading is cumulative up the ancestor chain, not nearest-file-only

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-10
**Citation:** [refine-claude_10: WebFetch <https://code.claude.com/docs/en/memory> — "Claude also discovers CLAUDE.md and CLAUDE.local.md files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories."]

The trigger is reading a file in a subdirectory, and every `CLAUDE.md` on that file's ancestor path qualifies — a directory nested two levels below one that holds a `CLAUDE.md` is still "under" it. So reading `app/src/data-access-layer/useNpc.ts` would load both `app/src/CLAUDE.md` and a `CLAUDE.md` placed at `app/src/data-access-layer/`, not the deeper one alone. Splitting a large subdirectory `CLAUDE.md` into a parent and a child file therefore relieves only the reader that never descends into the child's directory; the reader that does descend holds both files and carries the same total, plus whatever framing the second file adds.

## A path-scoped rule lives in the repo-root `.claude/rules/` and loads when Claude works with a matching file, which no `CLAUDE.md` placement can express

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_17: memory page, Path-specific rules — "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns"; "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use"; pattern table rows `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`; brace expansion supported under a budget of 1,000 expanded patterns and 4 MiB per rule, patterns exceeding it used unexpanded and matching nothing; large-codebases page, "Choose between per-directory CLAUDE.md and path-scoped rules" table — per-directory `CLAUDE.md` "Inside the directory, alongside its code" loading "At launch when started from that directory, or on demand when Claude reads a file there", path-scoped rule "Central `.claude/` at the repo root" loading "When Claude works with a file matching the rule's `paths:` glob", used when "the same rule applies to many scattered paths"]

The two mechanisms are not interchangeable: a `paths` glob selects by extension, filename pattern, or a directory name at any depth, so it can carve a cross-cutting set (`**/*.css`, `**/__tests__/**`) that no directory boundary expresses, and unlike a subdirectory `CLAUDE.md` it is not cumulative with any ancestor file. The documentation names path-scoped rules as the remedy for an oversized `CLAUDE.md` twice — "If your instructions are growing large, use path-scoped rules so instructions load only when Claude works with matching files", and again under "My CLAUDE.md is too large" — and directs a multi-step procedure or content that "only matters for one part of the codebase" to a skill or a path-scoped rule rather than to `CLAUDE.md`.

## Starting Claude in a subdirectory loads that directory's `CLAUDE.md` plus every ancestor's at launch; starting at the repository root loads the root file alone

**Verified at:** <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_18: large-codebases page, "Choose where to start Claude" table — row "Repository root | Every file | Root only; subdirectory files load on demand when Claude reads there"; row "A subdirectory | That subtree only, until you grant more | That directory's plus every ancestor's"]

The on-demand loading condition of a subdirectory `CLAUDE.md` therefore holds only for sessions launched above it; a session launched at or below that directory holds the file from the first turn. Project settings in `.claude/settings.json` are not inherited from parent directories the way `CLAUDE.md` files are.

## A skill can be scoped by `paths` frontmatter or by placement in a subdirectory's own `.claude/skills/`

**Verified at:** <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_19: large-codebases page, "Add per-directory skills" — "Skills live under `.claude/skills/` inside the directory"; "When Claude works on a file in `packages/api/`, it loads the api-testing skill. When it works in `packages/web/`, it loads component-patterns instead. Neither directory's skills load during the other's tasks"; "You can also scope a skill by file pattern instead of by placement. The `paths` frontmatter field takes glob patterns, and Claude loads the skill automatically only when it works with matching files"; "Which skills are in scope depends on where you start Claude" — from the root, "skills from every subdirectory Claude touches during the session, which can accumulate into the hundreds"]

Names always load and only the chosen skill's full content enters context, but descriptions are shortened when many skills are discovered, which can strip the keywords the selection depends on. A skill's trigger is model judgment over that name and description, not a harness-enforced glob, even when `paths` narrows the candidate set.

## A `SessionStart` hook's stdout is added to the session's context before the first prompt

**Verified at:** <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_20: large-codebases page, "Recommend the right plugin at session start" — "A `SessionStart` hook can close that gap, since Claude Code adds plain text the hook prints to stdout to Claude's context before the first prompt"]

This is a launch-scope injection: it fires for every session in scope, so it broadens what a session holds rather than narrowing it, and it is configuration rather than a durable instruction file.

## `claudeMd` in a settings file is honored only in managed and policy layers, and `claudeMdExcludes` is a static list rather than a per-task switch

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_21: memory page, Deploy organization-wide CLAUDE.md — "The `claudeMd` key lets you put managed CLAUDE.md content directly inside `managed-settings.json` instead of deploying a separate file"; "**Where it's honored**: managed and policy settings only. Setting `claudeMd` in user, project, or local settings has no effect"; large-codebases page, "Exclude irrelevant CLAUDE.md files" — "The exclusion list is static, not a per-task switch. To focus on one package today and another tomorrow, start Claude from that package's directory instead of editing exclusions"]

Neither is a mechanism for scoping a project's own conventions: `claudeMd` is unavailable outside managed settings, and `claudeMdExcludes` removes an instruction file wholesale for whoever configures it rather than narrowing its audience.
