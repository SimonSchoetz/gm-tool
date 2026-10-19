# Claude Code

## In the desktop app's Code tab at Claude Code 2.1.287 with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set, `SendMessage` loads through `ToolSearch select:SendMessage`

**Verified at:** Claude Code 2.1.287, Claude desktop app Code tab — 2026-10-19
**Citation:** [claude_5: ran `ToolSearch select:SendMessage` in a Code-tab session — observed the tool's definition returned and the tool callable] [claude_9: ran `jq '.env' ~/.claude/settings.json` and `env | grep AGENT_TEAMS` in the same Code-tab session as claude_5 — observed `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `1` in both]

Whether `SendMessage` loads in a Code-tab session without that variable was not observed.

## A subagent starts with its agent file, the CLAUDE.md hierarchy, a git-status snapshot, and any skills named in its `skills` field; every other file must be read with a tool

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_7: "Each subagent starts with a fresh, isolated context window. It doesn't see your conversation history, the skills you've already invoked, or the files Claude has already read"; initial context lists system prompt (the agent's own prompt plus environment details), task message, CLAUDE.md files at every level the main conversation loads, git status, and "Preloaded skills: full content of any skill named in the agent's `skills` field"]

Reference helpers under a plugin's `reference/` are not in any of those categories, so a spawned agent holds a helper only after it follows a pointer and reads it.

## Claude Code's documented size targets: a CLAUDE.md under 200 lines, a SKILL.md body under 500 lines

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices> — 2026-09-04
**Citation:** [refine-claude_8: memory page, "Write effective instructions" — "**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence"; "Keep it to facts Claude should hold in every session … If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill or a path-scoped rule instead"; "imported files still load and enter the context window at launch"; skill best-practices page, "Token budgets" — "Keep SKILL.md body under 500 lines for optimal performance. If your content exceeds this, split it into separate files"]

Both limits are stated in lines, not characters, and the stated rationale is adherence (attention across competing instructions), not a hard loader limit: Claude Code loads a CLAUDE.md of up to 4 MiB in full. No size guidance is given for a skill's supporting files or for agent files; the skills guidance says reference files "don't consume context tokens until actually read".

## User-level rules in `~/.claude/rules/` load at launch, concatenate with every other instruction file, and are recommended one topic per file

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_10: "Personal rules in `~/.claude/rules/` apply to every project on your machine"; "User-level rules are loaded before project rules, giving project rules higher priority"; "Rules without `paths` frontmatter are loaded at launch with the same priority as `.claude/CLAUDE.md`"; "All `.md` files are discovered recursively"; "Each file should cover one topic, with a descriptive filename"; "All discovered files are concatenated into context rather than overriding each other"; "if two rules contradict each other, Claude may pick one arbitrarily"]

Priority means load order only; nothing overrides anything, and a contradiction between two loaded rules has no deterministic winner. Splitting one file into several unscoped rules files changes nothing about what a session holds at launch; only a `paths` frontmatter makes a rule load on demand. The relative load order between `~/.claude/CLAUDE.md` and `~/.claude/rules/` is not stated.

## A subagent's initial context includes project rules; user-level `~/.claude/rules/` is not named

**Verified at:** <https://code.claude.com/docs/en/sub-agents> — 2026-09-04
**Citation:** [refine-claude_13: "CLAUDE.md files: every level of the CLAUDE.md hierarchy the main conversation loads, including `~/.claude/CLAUDE.md`, project rules, `CLAUDE.local.md`, and managed policy files. The built-in Explore and Plan agents skip this." — where the memory page names `.claude/rules/` as "project rules"]

`.claude/rules/` files reach a spawned agent; whether `~/.claude/rules/` files do is not stated. A plugin citation that must resolve for a spawned agent should therefore not rely on a user-level rules file being in that agent's context; a path the agent can Read does not depend on it.

## `claudeMdExcludes` skips instruction files by absolute-path glob at any settings layer, and matches a symlinked rules file by either path from v2.1.239

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-04
**Citation:** [refine-claude_14: "Exclude specific CLAUDE.md files" — "Patterns are matched against absolute file paths using glob syntax. You can configure `claudeMdExcludes` at any settings layer: user, project, local, or managed policy. Arrays merge across layers"; "To exclude a rules file you reach through a symlink … write the pattern against either path … Before v2.1.239, only a pattern that matched the link target excluded the file"; "Managed policy CLAUDE.md files cannot be excluded"; first observed by head-of-instructions, cited from the same page]

The documented way to switch off one shared rules file for one machine or project without contradicting it; a whole rules directory is excluded with a `/…/.claude/rules/**` pattern.

## Subdirectory `CLAUDE.md` loading is cumulative up the ancestor chain, not nearest-file-only

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-09-10; observed in gm-tool on Claude Code 2.1.276 — 2026-09-19
**Citation:** [refine-claude_10: WebFetch <https://code.claude.com/docs/en/memory> — "Claude also discovers CLAUDE.md and CLAUDE.local.md files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories."] [refine-claude_28: in a session launched at the repository root, Read on `.claude/knowledge/tauri.md` loaded `.claude/knowledge/CLAUDE.md` and `.claude/CLAUDE.md`]

The trigger is reading a file in a subdirectory, and every `CLAUDE.md` on that file's ancestor path qualifies — a directory nested two levels below one that holds a `CLAUDE.md` is still "under" it. So reading `app/src/data-access-layer/useNpc.ts` would load both `app/src/CLAUDE.md` and a `CLAUDE.md` placed at `app/src/data-access-layer/`, not the deeper one alone. Splitting a large subdirectory `CLAUDE.md` into a parent and a child file therefore relieves only the reader that never descends into the child's directory; the reader that does descend holds both files and carries the same total, plus whatever framing the second file adds. Discovery also works inside a dot-directory: reading `.claude/knowledge/tauri.md` loaded `.claude/knowledge/CLAUDE.md`.

## A path-scoped rule lives in the repo-root `.claude/rules/` and loads when Claude uses the Read, Write or Edit tool on a file matching its `paths` glob, which no `CLAUDE.md` placement can express

**Verified at:** <https://code.claude.com/docs/en/memory> (re-read with `claude --version` reporting 2.1.287) — 2026-10-18; <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_17: memory page, Path-specific rules — "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns"; "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use"; pattern table rows `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`; brace expansion supported under a budget of 1,000 expanded patterns and 4 MiB per rule, patterns exceeding it used unexpanded and matching nothing; large-codebases page, "Choose between per-directory CLAUDE.md and path-scoped rules" table — per-directory `CLAUDE.md` "Inside the directory, alongside its code" loading "At launch when started from that directory, or on demand when Claude reads a file there", path-scoped rule "Central `.claude/` at the repo root" loading "When Claude works with a file matching the rule's `paths:` glob", used when "the same rule applies to many scattered paths"] [refine-claude_26: in a session launched at the repository root, Read on `app/src/App.css` loaded `app/CLAUDE.md`, `app/src/CLAUDE.md` and `.claude/rules/src-css.md`, and none of the other six rule files in that directory] [refine-claude_1: ran `claude --version` — observed 2.1.287; memory page, Path-specific rules, <https://code.claude.com/docs/en/memory> fetched 2026-10-18 — "A path-scoped rule loads when Claude uses the Read, Write, or Edit tool on a matching file. It also loads when Claude views a matching file with a Bash command that counts as a read, such as `cat` or `head` on a single file."]

The two mechanisms are not interchangeable: a `paths` glob selects by extension, filename pattern, or a directory name at any depth, so it can carve a cross-cutting set (`**/*.css`, `**/__tests__/**`) that no directory boundary expresses, and unlike a subdirectory `CLAUDE.md` it is not cumulative with any ancestor file. The documentation names path-scoped rules as the remedy for an oversized `CLAUDE.md` twice — "If your instructions are growing large, use path-scoped rules so instructions load only when Claude works with matching files", and again under "My CLAUDE.md is too large" — and directs a multi-step procedure or content that "only matters for one part of the codebase" to a skill or a path-scoped rule rather than to `CLAUDE.md`. A Bash command that counts as a read of a single matching file, such as `cat` or `head`, loads the rule too.

## Starting Claude in a subdirectory loads that directory's `CLAUDE.md` plus every ancestor's at launch; starting at the repository root loads the root file alone

**Verified at:** <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_18: large-codebases page, "Choose where to start Claude" table — row "Repository root | Every file | Root only; subdirectory files load on demand when Claude reads there"; row "A subdirectory | That subtree only, until you grant more | That directory's plus every ancestor's"]

The on-demand loading condition of a subdirectory `CLAUDE.md` therefore holds only for sessions launched above it; a session launched at or below that directory holds the file from the first turn. Project settings in `.claude/settings.json` are not inherited from parent directories the way `CLAUDE.md` files are.

## `claudeMd` in a settings file is honored only in managed and policy layers, and `claudeMdExcludes` is a static list rather than a per-task switch

**Verified at:** <https://code.claude.com/docs/en/memory> and <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_21: memory page, Deploy organization-wide CLAUDE.md — "The `claudeMd` key lets you put managed CLAUDE.md content directly inside `managed-settings.json` instead of deploying a separate file"; "**Where it's honored**: managed and policy settings only. Setting `claudeMd` in user, project, or local settings has no effect"; large-codebases page, "Exclude irrelevant CLAUDE.md files" — "The exclusion list is static, not a per-task switch. To focus on one package today and another tomorrow, start Claude from that package's directory instead of editing exclusions"]

Neither is a mechanism for scoping a project's own conventions: `claudeMd` is unavailable outside managed settings, and `claudeMdExcludes` removes an instruction file wholesale for whoever configures it rather than narrowing its audience.

## A `.claude/rules/` directory created during a session is discovered without a restart

**Verified at:** gm-tool, Claude Code desktop app Code tab — 2026-09-10
**Citation:** [refine-claude_27: `.claude/rules/` did not exist when the session started; seven path-scoped rule files were written to it mid-session; a later Read on `app/src/App.css` in the same session loaded `.claude/rules/src-css.md`]

Rules discovery is not a launch-time snapshot, unlike plugin discovery, where a newly created plugin folder needs a restart and `/reload-plugins` does not find it. A session that writes a new path-scoped rule can therefore exercise it without restarting, which makes a rules partition testable in the session that performs it.

## Agent teams require both `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and an interactive session

**Verified at:** <https://code.claude.com/docs/en/agent-teams> — 2026-09-10 (page states it describes agent teams as of v2.1.178); behavior observed at Claude Code 2.1.268
**Citation:** [refine-claude_1: <https://code.claude.com/docs/en/agent-teams> — "Enable agent teams" section] [refine-claude_5: ran npm ls -g --depth=0 and claude --version — observed @anthropic-ai/claude-code@2.1.268; behavioral outcome user-reported, not independently observed by this role]

The env var alone is insufficient. The documentation states: "Spawning teammates also requires an interactive session. In non-interactive mode with the `-p` flag, including Agent SDK sessions, Claude doesn't spawn teammates, and a subagent that Claude named runs as an ordinary subagent even with agent teams enabled." Consequence: in an Agent SDK or non-interactive session, calling the Agent tool with a `name` produces an ordinary subagent rather than a teammate.

## `SendMessage` is the documented replacement for the Agent tool's removed `resume` parameter, and is gated behind agent teams

**Verified at:** <https://github.com/anthropics/claude-code/issues/42737> — 2026-09-10
**Citation:** [refine-claude_2: <https://github.com/anthropics/claude-code/issues/42737> — issue body and closure status]

The Agent tool's `resume` parameter was removed in v2.1.77 and `SendMessage({to: agentId})` became the documented way to continue a previously spawned subagent. `SendMessage` is provisioned only when the agent teams feature is active, so in a session without it the Agent tool's own result text instructs the caller to use a tool that is not in the tool list and is not loadable via ToolSearch. Issues #35240, #37051, #42737, and #34750 all report this; #42737 and #25148 are closed as not planned/duplicate with no published Anthropic rationale.

## `TeamCreate` and `TeamDelete` were removed in v2.1.178; team names are now session-derived

**Verified at:** <https://code.claude.com/docs/en/agent-teams> — 2026-09-10
**Citation:** [refine-claude_3: <https://code.claude.com/docs/en/agent-teams> — Note under the page introduction, and "Architecture" section]

Before v2.1.178 the lead called `TeamCreate`/`TeamDelete` to set up and remove a user-named team. Both tools no longer exist. Team name is now `session-` plus the first eight characters of the session ID, config lives at `~/.claude/teams/{team-name}/config.json`, and the `team_name` input on the Agent tool is accepted but ignored. Consequence: a `~/.claude/teams/` directory holding user-chosen names is a leftover from a pre-v2.1.178 session, not evidence of a currently active team.

## Cross-session `SendMessage` and in-session subagent `SendMessage` are separately gated surfaces

**Verified at:** <https://code.claude.com/docs/en/changelog> — 2026-09-10, entries v2.1.248 through v2.1.259
**Citation:** [refine-claude_4: <https://code.claude.com/docs/en/changelog> — v2.1.248 (2026-08-27), v2.1.251 (2026-08-28), v2.1.257 (2026-09-01), v2.1.259 (2026-09-02)]

Cross-session messaging (`SendMessage`/`ListAgents` between separate sessions on one machine) was extended in late August 2026 to Bedrock/Vertex/Foundry and to telemetry-disabled setups, while the in-session subagent/teammate addressing surface of the same name stayed behind the agent teams gate. Consequence: a session can hold a working cross-session send capability and `ListAgents` while having no way to address its own subagents.

## When a skill is invoked with arguments and its content holds no argument placeholder, Claude Code appends `ARGUMENTS: <input>` to the end of the skill content

**Verified at:** <https://code.claude.com/docs/en/skills> — 2026-10-18
**Citation:** [refine-claude_2: skills page, "Pass arguments to skills" — "If you invoke a skill with arguments but no placeholder in the skill's content receives one, Claude Code appends `ARGUMENTS: <your input>` to the end of the skill content so Claude still sees what you typed."]

A skill whose body names no argument placeholder (`$ARGUMENTS`, `$1`, a named argument) therefore still receives what the user typed after the command name, as that appended line.

## Claude Code 2.1.287's binary holds a routine that, given a main repository root and a worktree path, reads `core.hooksPath` from the main repository's own git `config` file and runs `git config core.hooksPath <that value made absolute>` in the worktree only when the value is set and not absolute

**Verified at:** Claude Code 2.1.287 — 2026-10-19
**Citation:** [claude_17: `/Users/simonschoetz/.local/share/claude/versions/2.1.287`, the minified `async function TAe(e,n)` at byte offset 186954933 — resolves the git directory of the repository root `e` (following a `commondir` file when one exists), reads `hooksPath` from the `core` section of that directory's `config` with its own file parser, and when the value is set computes an absolute form of it and, when that differs from the value read, runs `git config core.hooksPath <absolute form>` with `n` as working directory, logging `Configured worktree to use hooks from main repository: <path>` on success; an unset value or one already absolute runs no `git config`]

The routine reads the config file directly, so a `core.hooksPath` from global or system git config is not copied; the call it runs names no scope flag, so which config file the worktree value lands in is not stated by the source.

## `mcp__ccd_session_mgmt__list_sessions` listed desktop-app sessions with `isRunning: false`, two of them absent from `ListAgents`, each with `sessionId`, title, folder, last activity and, for a worktree session, branch

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_7: ran `mcp__ccd_session_mgmt__list_sessions` with limit 40 from a Code-tab session — observed 25 rows including "I: Content section" and "PF: Content section" (last activity 2026-10-19T06:42Z and 2026-10-18T15:05Z), each with `sessionId`, `title`, `cwd`, `isRunning: false`, `lastActivityAt` and, for worktree sessions, `branch`; ran `ListAgents` in the same session — observed three peer rows, all sessions started that day, and neither of those two]

The `sessionId` field of such a row is what the entry below passed to `mcp__ccd_session_mgmt__send_message`.

## `mcp__ccd_session_mgmt__send_message` to a session listed with `isRunning: false` and absent from `ListAgents`, asking it to reply by the same tool, reported `delivery: delivered` and "its turn has started on it", and that session's reply arrived in the sender as a `<cross-session-message from="<session id>">` turn

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_8: ran `mcp__ccd_session_mgmt__send_message` with the `sessionId` value of the `list_sessions` row for "I: Content section" (`local_68f18432-…`, `isRunning: false`), which `ListAgents` had not listed moments before, carrying a request to reply by the same tool — observed the result "Message delivered to session … its turn has started on it. (delivery: delivered; message_id: …)", and later a turn in the sending session wrapped as `<cross-session-message from="local_68f18432-…" name="I: Content section">` whose text named the branch it had implemented and stated that its context still held the review-loop findings]

Whether that session's process had exited before the send was not observed.

## `mcp__ccd_session_mgmt__get_session` called with `"self"` returned the calling session's own `sessionId` in the form `local_<uuid>`, together with an `isArchived` boolean

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_1: ran `mcp__ccd_session_mgmt__get_session` with `session_id` `"self"` from a Code-tab session — observed `"sessionId": "local_55280101-…"`, `"isArchived": false`, `"isRunning": true`, plus title, cwd, `parentSessionId` and model]

A session can therefore learn its own id without listing sessions.

## `mcp__ccd_session_mgmt__send_message` reports `delivered` when the target's turn has started, `queued` when it waits behind the target's current work, and an error otherwise

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_2: the tool's own description, loaded through `ToolSearch select:mcp__ccd_session_mgmt__send_message` — "\"delivered\" means that session's turn has started on your message; \"queued\" means it is waiting behind that session's current work … anything else is an error saying why it was not delivered"]

The same description says the message arrives in the target as a user turn labelled "From {this session's title}", and that `SendMessage` with the target's `local_…` id is the preferred tool.

## `mcp__ccd_session_mgmt__get_usage` reported the context window of a session listed with `isRunning: false`

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_3: ran `mcp__ccd_session_mgmt__get_usage` with the `sessionId` of a session that `list_sessions` showed with `isRunning: false` and last activity 06:56Z — observed `"status": "ok"`, `"tokensUsed": 521183` of a 1,000,000 window, Messages 434,966 tokens] [claude_7: the tool's own description, loaded through `ToolSearch select:mcp__ccd_session_mgmt__get_usage` — context is "read from the session's own process, so an idle, starting or archived session reports it unavailable"]

The description predicts `unavailable` for an idle session, but this one listed with `isRunning: false` reported its context, so a context reading is worth attempting before a session is woken.

## A session holding 521,183 context tokens, messaged with `send_message` while idle, replied in 22 seconds and grew by about 10,000 tokens

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_4: sent a one-line question to the idle session "Lean gimbal: cap refine…" at 13:32:18Z (`delivery: delivered`) — observed its `<cross-session-message>` reply in the sender by 13:32:40Z, `get_usage` on it before 521,183 and after 531,254 tokens, and the account's 5-hour plan usage at 8% both before and after]

The plan meter's whole-percent resolution did not register one such wake-up; how many input tokens it billed, and how many of them were served from cache, was not observed.

## A cross-session reply arrives as its own turn while a background Bash command of the session awaiting it is still running, and that command's exit later starts a further turn

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_5: started two `run_in_background` Bash commands (`sleep 900`, `sleep 300`), sent a `send_message` and ended the turn — observed the reply turn at 13:32:40Z with `pgrep` showing both `sleep` processes alive, and at the 300-second sleep's exit (13:37:18Z) a `<task-notification>` turn with status `completed`]

A background `sleep` therefore serves as a deadline timer for collecting cross-session replies without blocking them.

## `TaskStop` on a running background Bash command ended it as `[killed]` and started no turn in the following four and a half minutes

**Verified at:** Claude Code 2.1.287, Claude desktop app — 2026-10-19
**Citation:** [claude_6: ran `TaskStop` on the running `sleep 900` command at 13:32:48Z — observed "Successfully stopped task", the `sleep 900` process gone from `pgrep`, the command's output file ending `[killed]`, and no turn in the session until the other background command's exit notification at 13:37:18Z]

Whether the stopped command would start a turn later than that window was not observed.
