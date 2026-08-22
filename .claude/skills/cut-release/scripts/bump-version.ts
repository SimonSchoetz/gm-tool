#!/usr/bin/env node
// Bumps the version in all three locations this project's release process requires to stay in sync: app/src-tauri/tauri.conf.json, app/src-tauri/Cargo.toml, app/package.json. app/pnpm-lock.yaml carries no copy of the project's own version (verified: it records only dependency specifiers under `importers`), so — unlike npm's package-lock.json — it needs no corresponding edit here; `pnpm install` picks up the bumped package.json version on its own. Every edit is a targeted string/regex replace, never a JSON.parse + JSON.stringify round-trip — stringify re-indents the whole file and collapses/expands arrays to its own formatting rules (verified: it turned tauri.conf.json's single-line "scope": ["**"] into a 3-line array), which would pollute a version-bump commit with unrelated formatting noise.
// Usage: node bump-version.ts <newVersion> — e.g. node bump-version.ts 0.9.0. Run from anywhere; paths resolve relative to this script's own location, not the caller's cwd.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

type UpdatedLocation = {
  file: string;
  field: string;
  oldVersion: string;
  newVersion: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..', '..', '..', '..');
const appDir = path.join(repoRoot, 'app');

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(
    'Usage: node bump-version.ts <newVersion>\nExpected semver MAJOR.MINOR.PATCH with no leading "v", e.g. 0.9.0',
  );
  process.exit(1);
}

const updated: UpdatedLocation[] = [];

// Replaces the first occurrence of a `"version": "<oldVersion>"` key in a JSON file's raw text, preserving every byte of surrounding formatting.
const replaceFirstVersionField = (
  content: string,
  oldVersion: string,
  newVersionValue: string,
  file: string,
): string => {
  const target = `"version": "${oldVersion}"`;
  const index = content.indexOf(target);
  if (index === -1) {
    console.error(`Could not find ${target} in ${file}`);
    process.exit(1);
  }
  const replacement = `"version": "${newVersionValue}"`;
  return (
    content.slice(0, index) + replacement + content.slice(index + target.length)
  );
};

// package.json — single top-level "version" field, near the top of the file
{
  const file = path.join(appDir, 'package.json');
  const content = readFileSync(file, 'utf8');
  const oldVersion = (JSON.parse(content) as { version: string }).version;
  writeFileSync(file, replaceFirstVersionField(content, oldVersion, newVersion, file));
  updated.push({ file, field: 'version', oldVersion, newVersion });
}

// src-tauri/tauri.conf.json — single top-level "version" field
{
  const file = path.join(appDir, 'src-tauri', 'tauri.conf.json');
  const content = readFileSync(file, 'utf8');
  const oldVersion = (JSON.parse(content) as { version: string }).version;
  writeFileSync(file, replaceFirstVersionField(content, oldVersion, newVersion, file));
  updated.push({ file, field: 'version', oldVersion, newVersion });
}

// src-tauri/Cargo.toml — line-based replace, TOML has no JSON parser here. Anchored to column 0 so it only ever matches [package]'s version line, never a dependency's (every dependency in this file uses inline `dep = "1"` / `dep = { version = "1" }` syntax, never an expanded [dependencies.foo]-table form where "version = ..." would also sit at column 0).
{
  const file = path.join(appDir, 'src-tauri', 'Cargo.toml');
  const content = readFileSync(file, 'utf8');
  const match = /^version = "([^"]+)"/m.exec(content);
  if (!match) {
    console.error(`Could not find a top-level "version = ..." line in ${file}`);
    process.exit(1);
  }
  const oldVersion = match[1];
  const next = content.replace(/^version = "[^"]+"/m, `version = "${newVersion}"`);
  writeFileSync(file, next);
  updated.push({ file, field: 'version', oldVersion, newVersion });
}

console.log(`Bumped to ${newVersion} in ${updated.length} locations:`);
for (const { file, field, oldVersion } of updated) {
  console.log(`  ${path.relative(repoRoot, file)} (${field}): ${oldVersion} -> ${newVersion}`);
}
