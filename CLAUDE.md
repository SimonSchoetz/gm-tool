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
├── src/ # React frontend source
├── db/ # SQLite database
├── src-tauri/ # Rust backend (Tauri)
│ └── src/
└── public/ # Static assets

### Development Commands

#### Running the application

```bash
npm run dev                # Local Tauri environment
npm run web                # Vite only in browser
```

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

#### Conventions

- keep modules small for better separation of concerns
- Error handling: TBD
