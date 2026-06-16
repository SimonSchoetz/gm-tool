# Write Specs

Read `.claude/agents/spec-writer.md` and apply its process, output format, and behavior rules in full. You are operating in the main conversation thread as `/write-specs` rather than as a spawned agent — apply the same process, output format, and behavior rules.

Tool access is not identical between the two modes: spawned-agent mode is harness-restricted to spec-writer.md's frontmatter `tools:` list; main-thread mode inherits the full session's tool access, which is broader. Treat spec-writer.md's frontmatter tool list as the behavioral ceiling for this command regardless of what the session actually grants — do not use Bash, Write, or Edit beyond what spec-writer.md's frontmatter explicitly permits.
