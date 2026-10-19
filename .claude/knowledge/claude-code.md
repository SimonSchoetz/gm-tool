# Claude Code

## In the desktop app's Code tab at Claude Code 2.1.299 with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set, `SendMessage` loads through `ToolSearch select:SendMessage`

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
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

**Verified at:** <https://code.claude.com/docs/en/memory> — 2026-10-18; <https://code.claude.com/docs/en/large-codebases> — 2026-09-10
**Citation:** [refine-claude_17: memory page, Path-specific rules — "Rules can be scoped to specific files using YAML frontmatter with the `paths` field. These conditional rules only apply when Claude is working with files matching the specified patterns"; "Path-scoped rules trigger when Claude reads files matching the pattern, not on every tool use"; pattern table rows `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`; brace expansion supported under a budget of 1,000 expanded patterns and 4 MiB per rule, patterns exceeding it used unexpanded and matching nothing; large-codebases page, "Choose between per-directory CLAUDE.md and path-scoped rules" table — per-directory `CLAUDE.md` "Inside the directory, alongside its code" loading "At launch when started from that directory, or on demand when Claude reads a file there", path-scoped rule "Central `.claude/` at the repo root" loading "When Claude works with a file matching the rule's `paths:` glob", used when "the same rule applies to many scattered paths"] [refine-claude_26: in a session launched at the repository root, Read on `app/src/App.css` loaded `app/CLAUDE.md`, `app/src/CLAUDE.md` and `.claude/rules/src-css.md`, and none of the other six rule files in that directory]

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

## The CLI binary at `~/.local/share/claude/versions/2.1.287` holds a routine that, given a main repository root and a worktree path, reads `core.hooksPath` from the main repository's own git `config` file and runs `git config core.hooksPath <that value made absolute>` in the worktree only when the value is set and not absolute

**Verified at:** Claude Code 2.1.287, the CLI binary at `~/.local/share/claude/versions/2.1.287` — 2026-10-19
**Citation:** [claude_17: `/Users/simonschoetz/.local/share/claude/versions/2.1.287`, the minified `async function TAe(e,n)` at byte offset 186954933 — resolves the git directory of the repository root `e` (following a `commondir` file when one exists), reads `hooksPath` from the `core` section of that directory's `config` with its own file parser, and when the value is set computes an absolute form of it and, when that differs from the value read, runs `git config core.hooksPath <absolute form>` with `n` as working directory, logging `Configured worktree to use hooks from main repository: <path>` on success; an unset value or one already absolute runs no `git config`]

The routine reads the config file directly, so a `core.hooksPath` from global or system git config is not copied; the call it runs names no scope flag, so which config file the worktree value lands in is not stated by the source. The desktop app's bundled 2.1.299 binary was not read.

## `mcp__ccd_session_mgmt__list_sessions` listed desktop-app sessions with `isRunning: false`, two of them absent from `ListAgents`, each with `sessionId`, title, folder, last activity and, for a worktree session, branch

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_7: ran `mcp__ccd_session_mgmt__list_sessions` with limit 40 from a Code-tab session — observed 25 rows including "I: Content section" and "PF: Content section" (last activity 2026-10-19T06:42Z and 2026-10-18T15:05Z), each with `sessionId`, `title`, `cwd`, `isRunning: false`, `lastActivityAt` and, for worktree sessions, `branch`; ran `ListAgents` in the same session — observed three peer rows, all sessions started that day, and neither of those two]

The `sessionId` field of such a row is what the entry below passed to `mcp__ccd_session_mgmt__send_message`.

## `mcp__ccd_session_mgmt__send_message` to a session listed with `isRunning: false` and absent from `ListAgents`, asking it to reply by the same tool, reported `delivery: delivered` and "its turn has started on it", and that session's reply arrived in the sender as a `<cross-session-message from="<session id>">` turn

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_8: ran `mcp__ccd_session_mgmt__send_message` with the `sessionId` value of the `list_sessions` row for "I: Content section" (`local_68f18432-…`, `isRunning: false`), which `ListAgents` had not listed moments before, carrying a request to reply by the same tool — observed the result "Message delivered to session … its turn has started on it. (delivery: delivered; message_id: …)", and later a turn in the sending session wrapped as `<cross-session-message from="local_68f18432-…" name="I: Content section">` whose text named the branch it had implemented and stated that its context still held the review-loop findings]

Whether that session's process had exited before the send was not observed.

## `mcp__ccd_session_mgmt__get_session` called with `"self"` returned the calling session's own `sessionId` in the form `local_<uuid>`, together with an `isArchived` boolean

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_1: ran `mcp__ccd_session_mgmt__get_session` with `session_id` `"self"` from a Code-tab session — observed `"sessionId": "local_55280101-…"`, `"isArchived": false`, `"isRunning": true`, plus title, cwd, `parentSessionId` and model]

A session can therefore learn its own id without listing sessions.

## `mcp__ccd_session_mgmt__send_message` reports `delivered` when the target's turn has started, `queued` when it waits behind the target's current work, and an error otherwise

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_2: the tool's own description, loaded through `ToolSearch select:mcp__ccd_session_mgmt__send_message` — "\"delivered\" means that session's turn has started on your message; \"queued\" means it is waiting behind that session's current work … anything else is an error saying why it was not delivered"]

The same description says the message arrives in the target as a user turn labelled "From {this session's title}", and that `SendMessage` with the target's `local_…` id is the preferred tool.

## `mcp__ccd_session_mgmt__get_usage` reported the context window of a session listed with `isRunning: false`

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_3: ran `mcp__ccd_session_mgmt__get_usage` with the `sessionId` of a session that `list_sessions` showed with `isRunning: false` and last activity 06:56Z — observed `"status": "ok"`, `"tokensUsed": 521183` of a 1,000,000 window, Messages 434,966 tokens] [claude_7: the tool's own description, loaded through `ToolSearch select:mcp__ccd_session_mgmt__get_usage` — context is "read from the session's own process, so an idle, starting or archived session reports it unavailable"]

The description predicts `unavailable` for an idle session, but this one listed with `isRunning: false` reported its context, so a context reading is worth attempting before a session is woken.

## A session holding 521,183 context tokens, messaged with `send_message` while idle, replied in 22 seconds and grew by about 10,000 tokens

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_4: sent a one-line question to the idle session "Lean gimbal: cap refine…" at 13:32:18Z (`delivery: delivered`) — observed its `<cross-session-message>` reply in the sender by 13:32:40Z, `get_usage` on it before 521,183 and after 531,254 tokens, and the account's 5-hour plan usage at 8% both before and after]

The plan meter's whole-percent resolution did not register one such wake-up; how many input tokens it billed, and how many of them were served from cache, was not observed.

## A cross-session reply arrives as its own turn while a background Bash command of the session awaiting it is still running, and that command's exit later starts a further turn

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_5: started two `run_in_background` Bash commands (`sleep 900`, `sleep 300`), sent a `send_message` and ended the turn — observed the reply turn at 13:32:40Z with `pgrep` showing both `sleep` processes alive, and at the 300-second sleep's exit (13:37:18Z) a `<task-notification>` turn with status `completed`]

A background `sleep` therefore serves as a deadline timer for collecting cross-session replies without blocking them.

## `TaskStop` on a running background Bash command ended it as `[killed]` and started no turn in the following four and a half minutes

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_6: ran `TaskStop` on the running `sleep 900` command at 13:32:48Z — observed "Successfully stopped task", the `sleep 900` process gone from `pgrep`, the command's output file ending `[killed]`, and no turn in the session until the other background command's exit notification at 13:37:18Z]

Whether the stopped command would start a turn later than that window was not observed.

## A session started by another session and running on that session's brief is refused `mcp__ccd_session__start_session` with initiation `user_asked`; the error directs it to propose with `own_initiative` or to "start it once the user asks you here"

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_1: ran `mcp__ccd_session__start_session` twice in one message (initiation `user_asked`, context `fresh`, `use_worktree: false`, title, name, prompt and background each) at 13:53:57Z from a session whose only input so far was the brief of the session that started it — observed both calls fail with "Start sessions only on the user's own words to you here; this turn runs an automated event, another session's message, or the task another session gave you. Propose the session instead (initiation \"own_initiative\"), or start it once the user asks you here."]

The error names the origin of the current turn as the reason, in its own words: "this turn runs an automated event, another session's message, or the task another session gave you".

## A user message typed into a session started by another session, asking it to start two sessions, was followed by `mcp__ccd_session__start_session` with initiation `user_asked` succeeding there on that turn

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_3: after the user typed "Go ahead and start the two probe sessions yourself now, on my word" directly into the session that another session had started, ran the same two `user_asked` calls that had been refused on the starting session's brief, at 13:56:42Z–13:56:53Z — observed "Started session … (session_id: local_59e83898-8f16-44dd-99e7-35ce87a0e473, name: probe-skill-brief)" and "Started session … (session_id: local_995b22cd-c688-4108-81a0-0fefbe54ff2a, name: probe-agent-brief)"]

Whether a user message that does not ask for a start has the same effect, and whether the effect outlasts that turn, was not observed.

## A session brief whose first line was `/gimbal:setup --check` was reported by the started session as arriving as plain text with `gimbal:setup` absent from its skill listing, yet its `Skill` call with name `gimbal:setup` and args `--check` returned the skill content with the line "argument received: `--check`"

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_4: started session `local_59e83898-8f16-44dd-99e7-35ce87a0e473` at 13:56:53Z with a `fresh` brief whose first line was `/gimbal:setup --check` — observed its `send_message` reply before 13:58:04Z: "The slash command on the first line arrived as plain text (no command expansion in my context, and gimbal:setup was absent from the skill list I was given), but calling the Skill tool with the name `gimbal:setup` and args `--check` succeeded and loaded the skill, whose first heading is `# Setup`"] [probe_5: ran `mcp__ccd_session_mgmt__list_events` on that session — observed an assistant `(called Skill)` followed by a user turn "Base directory for this skill: /Users/simonschoetz/.claude/skills/gimbal/skills/setup" and the full Setup skill text with "argument received: `--check`"]

The session reported after loading the skill and did not run the `--check` process itself; whether a brief can make it run the loaded skill to completion was not observed.

## A session started by another session, asked by a message from a third session to call `mcp__ccd_session__start_session` with initiation `user_asked`, is refused with the same "only on the user's own words" error

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_6: sent a `SendMessage` at 13:58:36Z to the idle session `local_59e83898-8f16-44dd-99e7-35ce87a0e473` asking it to call `start_session` (initiation `user_asked`, context `fresh`, `use_worktree: false`, title, name, background, prompt) once and quote the result — observed its reply turn within two minutes: "was refused; its result text verbatim: \"Start sessions only on the user's own words to you here; this turn runs an automated event, another session's message, or the task another session gave you. Propose the session instead (initiation \"own_initiative\"), or start it once the user asks you here.\" No card proposed, no retry."]

Together with the entry on a session running on another session's brief above: in the observed cases, a session acting on a brief or on another session's message was refused `user_asked`, and the one acting on a start request the user typed was not.

## A `fresh` session brief that names `~/.claude/skills/gimbal/agents/architect.md` by path and says to apply its full process made the started session read that file, run the architect process on a one-line story, and reply with the verdict's first heading as the file's Output Format defines it

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_7: started session `local_995b22cd-c688-4108-81a0-0fefbe54ff2a` at 13:56:53Z with that brief and the story "a button on the session screen that copies the session's title to the clipboard" — observed its `send_message` reply "### Decision Reconstructed" as its own turn in the probe session, read at 14:08:24Z] [probe_8: ran `grep -n 'Decision Reconstructed' ~/.claude/skills/gimbal/agents/architect.md` — found at line 47] [probe_9: ran `mcp__ccd_session_mgmt__search_session_transcripts` with query "it is to stress-test them" — observed a hit for that session whose snippet continues "## Context You Work With - The user will bring a decision", the architect file's own body, so the file was read into its transcript]

Wall clock from the start at 13:56:53Z to the reply being read at 14:08:24Z was about 11.5 minutes.

## A three-session round trip, in which the probe session messaged session A and A reported asking session B one question and relaying B's answer, completed in under one minute, growing A by about 6,800 context tokens, B by about 1,900 and the probe session by about 5,200, with the 5-hour plan meter unchanged at whole-percent resolution

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [probe_10: sent a request to ask session B what the first heading of its verdict was and to relay the answer, to session A, then idle, (`local_59e83898-8f16-44dd-99e7-35ce87a0e473`) at 14:09:18Z (`delivery: delivered`) — observed A's relay turn in the probe session before 14:10:17Z reading "Probe 3 relay: sent 14:09:29Z, reply arrived 14:10:03Z, answer: The first heading of the verdict I produced was \"### Decision Reconstructed\""] [probe_11: ran `mcp__ccd_session_mgmt__get_usage` on A (`local_59e83898-8f16-44dd-99e7-35ce87a0e473`), B (`local_995b22cd-c688-4108-81a0-0fefbe54ff2a`) and the probe session itself before the send and after the relay — observed A 106,333 → 113,123, B 207,541 → 209,424, the probe session 163,088 → 168,242 context tokens, and the 5-hour window at 14% both times]

Per A's relay text, the probe session's send at 14:09:18Z was followed by A's own send at 14:09:29Z, B's reply reached A at 14:10:03Z, and A's relay was in the probe session before 14:10:17Z; the probe session's growth includes its own usage reads between the two readings.

## Claude desktop app sessions on this machine ran a bundled Claude Code binary under `~/Library/Application Support/Claude/claude-code/2.1.299/`, while `claude --version` on the PATH reported 2.1.287

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app — 2026-10-19
**Citation:** [claude_10: ran `ps -axo pid,command | grep -i '[c]laude'` from a desktop-app session — observed every process whose command path lies under `Library/Application Support/Claude/claude-code/` at `claude-code/2.1.299/4fa9694b7975/claude.app/Contents/MacOS/claude`, and one process at `/Users/simonschoetz/.local/bin/claude`] [claude_11: ran `which claude && claude --version` in the same session — observed `/Users/simonschoetz/.local/bin/claude` and `2.1.287 (Claude Code)`] [claude_12: ran `ps -o command= -p $PPID` from that session's Bash tool — observed the session's own parent process at `/Users/simonschoetz/Library/Application Support/Claude/claude-code/2.1.299/4fa9694b7975/claude.app/Contents/MacOS/claude`]

From the Bash tool, `ps -o command= -p $PPID` prints the current session's own binary path, and the version in that path is the one a `Verified at` line for a desktop-app observation records.

## A user message carrying the text that a `mcp__ccd_turn__wrap_up` action had offered as a reply button — the box that tool draws under a session's last message — opened a turn in which `mcp__ccd_session__start_session` with initiation `user_asked` succeeded, in a session itself started on another session's brief

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_1: the session `local_d4be0398-6414-4ce7-b7b4-7e0a9ab3db9c`, started by another session on a brief, ended a turn with a `mcp__ccd_turn__wrap_up` call whose action had the message "Start the P1 probe session now, on my word."; that text then arrived in the session as a plain user turn, with no cross-session wrapper, and on that turn `mcp__ccd_session__start_session` (initiation `user_asked`, context `fresh`, `use_worktree: false`, cwd, title, name, prompt, background) at 17:00:24Z returned "Started session … (session_id: local_b3ce4779-d262-4788-88a6-8843a225fdf2, name: probe-date-utils-impl)"]

Whether the text was sent by the button or typed, and whether an AskUserQuestion button answer has the same effect, was not observed.

## `SendMessage` with `notify_when_idle: true` and `to` set to a desktop session's `local_` id returned "Nothing was subscribed", while the same call with `to` set to the title `ListAgents` shows for that session subscribed; delivery of a message by the same `local_` id succeeded

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_2: ran `SendMessage` with `to` `local_b3ce4779-d262-4788-88a6-8843a225fdf2`, `notify_when_idle: true` and no message, about 30 s after that session started at 17:00:24Z — observed `{"success":false,"message":"Nothing was subscribed: notify_when_idle is only supported for Claude sessions on this machine in this release (not teammates, subagents, Remote Control or cloud sessions)."}`] [tech-lead_3: ran the same call about a minute later with `to` `Implement: probe date utils`, that session's title in `ListAgents` without the bracketed ref — observed `{"success":true,"message":"Subscribed — you will get one notice here when \"Implement: probe date utils\" is next idle (or exits) …"}`, and later a `[Cross-session idle notice]` turn quoting the session's last turn] [tech-lead_9: ran `SendMessage` with `to` `local_b3ce4779-d262-4788-88a6-8843a225fdf2` and a message at 17:05Z — observed "Message delivered to session local_b3ce4779-d262-4788-88a6-8843a225fdf2 (\"Implement: probe date utils\"); its turn has started on it. (delivery: delivered …)"]

Whether the id form would be accepted on a later subscription call was not observed.

## `ListAgents` listed a session started with `name: probe-date-utils-impl` under its title, as `Implement: probe date utils [33d877]`, 26 seconds after the start, with no row carrying that `name`

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_4: ran `ListAgents` 26 s after `start_session` returned `name: probe-date-utils-impl` — observed the row "Implement: probe date utils [33d877] · interactive · idle · Claude Desktop session · started 26s ago" and no row carrying `probe-date-utils-impl`]

The bracketed `[33d877]` is the ref `ListAgents` appends to a row; the entry above shows the title accepted as `to` without it.

## A session started by another session sent `SendMessage` to its starter's `local_` id while the starter was mid-turn; the sender reported the message queued, and the starter received it as a `<cross-session-message from="<sender id>" name="<sender title>">` turn after its own turn ended

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_5: the transcript of `local_b3ce4779-d262-4788-88a6-8843a225fdf2`, read with `mcp__ccd_session_mgmt__list_events` — "sent `ready [T0]: probe-date-utils-impl is ready` to the lead session. The message is queued there"; its starter `local_d4be0398-6414-4ce7-b7b4-7e0a9ab3db9c` observed the turn `<cross-session-message from="local_b3ce4779-d262-4788-88a6-8843a225fdf2" name="Implement: probe date utils">` with that first line after its own turn ended, about four minutes after the start at 17:00:24Z]

Whether the message would have arrived sooner had the starter been idle was not observed.

## The Skill tool refused a skill whose frontmatter has `disable-model-invocation: true` when the model called it, with text beginning "Skill <name> cannot be used with Skill tool due to disable-model-invocation. Ask the user to run /<name> themselves"

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_6: ran `mcp__ccd_session_mgmt__search_session_transcripts` with the query "cannot be used with Skill tool due to disable-model-invocation" — observed a hit in `local_b3ce4779-d262-4788-88a6-8843a225fdf2`, a session started on another session's brief, whose snippet reads "…ll gimbal:implement cannot be used with Skill tool due to disable-model-invocation. Ask the user to run /gimbal:implement themselves — it cannot be invoked via th…", and a hit in another session at 17:10Z the same day with the same text for `gimbal:setup`] [tech-lead_6b: that session's own `escalation` report to its starter quoted the result in full: "Skill gimbal:implement cannot be used with Skill tool due to disable-model-invocation. Ask the user to run /gimbal:implement themselves — it cannot be invoked via the Skill tool. Do not replicate this skill's workflow by other means — it is reserved for explicit user invocation."] [tech-lead_7: ran `git log -S'disable-model-invocation: true' --format='%h %cs'` in the setup repository for `claude/gimbal/skills/setup/SKILL.md` and for `claude/gimbal/skills/implement/SKILL.md` — observed one commit each, `f0db03e 2026-09-11`, so both files carried the flag from that commit until commit `94e5fec` of the same repository removed it from implement on 2026-10-19 (the entry below beginning "Removing `disable-model-invocation: true`" dates it)]

The entry above beginning "A session brief whose first line was `/gimbal:setup --check`" records the same tool loading `gimbal:setup` the same day at the same version; that brief's first line carried the skill's slash command, while the refused session's inputs — its brief and two messages from its starter — carried none, and whether that is the difference was not observed.

## In auto mode, the Claude Code auto mode classifier denied one `SendMessage` whose first line was a slash command and whose body asked the receiving session to retry a refused Skill call, with the reason "[Auto-Mode Bypass]"

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab, auto mode — 2026-10-19
**Citation:** [tech-lead_8: ran `SendMessage` to `local_b3ce4779-d262-4788-88a6-8843a225fdf2` with a message whose first line was `/gimbal:implement <spec path>` and whose body asked that session to retry the Skill call it had reported refused — observed "Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass]."; a message to the same session without a slash line, telling it to hold, was delivered a minute later]

Which part of the denied message triggered the denial — the slash line, the retry request, or both — was not isolated.

## Removing `disable-model-invocation: true` from an installed skill's frontmatter mid-session made the skill appear in the session's available-skills listing on the next turn, without a restart

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_10: edited `/Users/simonschoetz/dev/setup/claude/gimbal/skills/implement/SKILL.md` (installed through the symlink `~/.claude/skills/gimbal`) to drop its `disable-model-invocation: true` line, committed as `94e5fec` of the setup repository — observed, in the next turn of the editing session, a harness notice "The following skills are available for use with the Skill tool: - gimbal:implement: Implement a spec file, …", a skill the listing had not shown before] [tech-lead_10b: ran `git log -1 --format=%cI 94e5fec` in the setup repository — observed `2026-10-19T19:19:32+02:00`, that is 17:19:32Z]

Whether the Skill tool then accepts a call for that skill was not observed in that session.

## A session started on another session's brief, told by a later cross-session message to read the installed `gimbal/skills/implement/SKILL.md` by path and apply its full process to a spec, ran it through to a completion message in about 20 minutes, sending its starter nothing in between

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_11: the session `local_b3ce4779-d262-4788-88a6-8843a225fdf2`, started at 17:00:24Z in a scratch clone of this repository on a brief naming its starter `local_d4be0398-6414-4ce7-b7b4-7e0a9ab3db9c` as the addressee of every stop, received at about 17:13Z a message saying to read `/Users/simonschoetz/dev/setup/claude/gimbal/skills/implement/SKILL.md` in full and apply its full process to `app/docs/SPEC_PROBE_DATE_UTILS.md`, a spec of two sub-features the starter had written — the starter observed, before 17:32:30Z and with no other message from that session in between, its completion message naming four commits, every `checks` row and the build green, one code-reviewer subagent run whose findings it applied, three findings left for the user, and that it had read the file in place of the Skill call its harness had refused] [tech-lead_12: ran `git log --format='%h %cs %ct %s' main..HEAD` in that clone — observed `73de55c3 … 1792430110 docs(probe-date-utils): add spec …`, `c5ff54c3 … 1792430412 refactor(probe-date-utils): compose the date part …`, `9198ac0b … 1792430556 refactor(probe-date-utils): extract getTimeString …`, `74e1ea1f … 1792430962 fix(probe-date-utils): address review findings`, that is 17:15:10Z to 17:29:22Z, on branch `refactor/probe-date-utils`] [tech-lead_13: ran `mcp__ccd_session_mgmt__get_usage` on that session after the completion message — observed `"tokensUsed": 255789` of a 1,000,000 window, Messages 166,000]

Its context stood at 255,789 tokens afterwards; whether it called AskUserQuestion during the run was not looked up.

## After `disable-model-invocation: true` was removed from an installed skill's frontmatter, the Skill tool in a session started on another session's brief accepted a call for that skill, with the tool result `Launching skill: gimbal:implement`

**Verified at:** Claude Code 2.1.299 (the desktop app's bundled runtime), Claude desktop app Code tab — 2026-10-19
**Citation:** [tech-lead_14: ran `mcp__ccd_session_mgmt__search_session_transcripts` with the query "Launching skill: gimbal:implement" at 17:37Z — observed one hit, in `local_b3ce4779-d262-4788-88a6-8843a225fdf2`, last active 17:33:08Z, the session whose call for the same skill the entry above beginning "The Skill tool refused a skill whose frontmatter has" records as refused — that refusal reached the starter as a message at about 17:06Z, the removal is dated 17:19:32Z by the entry above beginning "Removing `disable-model-invocation: true`", and the accepted call lies within the session's activity up to 17:33:08Z] [tech-lead_15: that session's own report of the accepted call, sent to its starter by 17:33Z and read there at about 17:35Z — the content began `Base directory for this skill: /Users/simonschoetz/.claude/skills/gimbal/skills/implement`, its first heading was `# Implement`, its pointers read `/Users/simonschoetz/.claude/skills/gimbal/reference/exchange-team-messages.md` and `/Users/simonschoetz/.claude/skills/gimbal/rules/<file>.md`, and its last line was `ARGUMENTS: <the path given as args>`] [tech-lead_16: ran `readlink ~/.claude/skills/gimbal` — observed `/Users/simonschoetz/dev/setup/claude/gimbal`] [tech-lead_17: ran `grep -c '${CLAUDE_PLUGIN_ROOT}' /Users/simonschoetz/dev/setup/claude/gimbal/skills/implement/SKILL.md` — observed `14`]

Per the session's report, the loaded body carried the install symlink's own path where the file on disk writes `${CLAUDE_PLUGIN_ROOT}`, not the checkout the symlink points to.
