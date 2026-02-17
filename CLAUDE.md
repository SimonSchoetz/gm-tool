# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo

This is a mono repo containing all projects regarding the GM-Tool project. So far it contains:

- `_archive/`
- `app/`

## Archive (`_archive/`)

Contains an old web project which was more of a playground. It should be ignored by Claude unless stated otherwise.

## App (`app/`)

Project to build the app I want for my personal use without constraints like accessibility concerns.

### Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Database**: SQLite
- **Styling**: TBD

### App Structure (`app/`)

app/
├── db/ # SQLite database
│ └── CLAUDE.md
├── docs/ # documentation like templates
├── public/ # Static assets
├── src/ # React frontend source
│ └── CLAUDE.md
├── src-tauri/ # Rust backend (Tauri)
│ └── CLAUDE.md
└── util/

### Development Commands

#### Running the application

```bash
npm run dev                # Local Tauri environment
npm run web                # Vite only in browser
```

### Worktree Workflow

Claude Code uses the git worktree `~/.claude-worktrees/gm-tool/claude-code`. **Always reuse this worktree** — never create a new one. Before starting any coding:

1. **Sync with main:** Run `git merge main` to pull in the latest changes from the user's main branch
2. **Don't commit automatically.** Leave changes unstaged so the user can review diffs in Cursor's Source Control panel
3. **Commit only when the user says to** (or after review approval)
4. **Atomic commits:** One commit per logical sub-task (e.g. "DB layer", "service", "screen") — not one giant commit per feature
5. **Open Worktree command** When providing a summary for the first time or when asked, provide the command to open cursor window: `cursor ~/.claude-worktrees/gm-tool/claude-code`

### Code styles and convention

#### Coding style

- typescript first
- types over interfaces
- use modern arrow function syntax
- never return undefined, it should be an indicator for errors
- avoid using `any` as type
- Use descriptive names instead of comments
  ❌ BAD: `const data = await fetch(); // Get user data`
  ✅ GOOD: `const userData = await fetchUserData();`
- Use modern JavaScript operators for cleaner code:
  ❌ BAD: `const x = value !== undefined ? value : defaultValue`
  ✅ GOOD: `const x = value ?? defaultValue`
  ❌ BAD: `if (obj && obj.prop && obj.prop.nested) { ... }`
  ✅ GOOD: `if (obj?.prop?.nested) { ... }`
- use single quotes
- multiple array/object items in new lines

### Best Practices & Code Quality

- **Always suggest and implement best practices first**
- When multiple valid approaches exist, explain the tradeoffs and recommend the best option
- Proactively warn against anti-patterns, deprecated features, or "escape hatches" (like useImperativeHandle, useLayoutEffect, etc.)
- If a user requests an approach that goes against best practices, explain why it's not recommended and suggest the better alternative
- Don't just implement what's asked - guide toward the right solution
- Use SOLID principles where applicable
- **DRY (Don't Repeat Yourself)**: Always reuse existing functions instead of duplicating logic
  - If a function already exists that performs the needed operation, call it instead of reimplementing
  - Compose complex operations from existing simple functions
  - ❌ BAD: Duplicating database calls and state updates in multiple functions
  - ✅ GOOD: Calling existing `createImage()` and `deleteImage()` within `replaceImage()`

#### Conventions

- keep modules small for better separation of concerns
- Error handling: TBD

## Product

### Vision

Convinced of the transformative power and positive impact of table top role playing games (TTRPGs), the GM Tool makes crunchier systems like Dungeons and Dragons (D&D) more accessible for new audiences.

### Mission

Lowering the entry barrier for new Game Masters (GMs) and help experienced ones to avoid "GM fatigue"/burnout by guiding through the process of session preparation inspired by Michael Shea's "Return of the Lazy Dungeon Master". With an opinionated database structure, the GM Tool helps building an organic collection of non-player characters (NPCs), places, items, ect. and helps to track their influence on the story created with the players during game play.
