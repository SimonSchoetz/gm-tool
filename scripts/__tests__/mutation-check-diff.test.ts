import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  changedLinesAgainst,
  parseChangedLines,
} from '../mutation-check-diff.ts';
import { unsetGitEnvironment } from './support/isolated-git.ts';

// A hook-run test inherits the hook's GIT_* variables, which would point the scratch repositories' git commands at the real repository (./support/isolated-git.ts).
beforeEach(unsetGitEnvironment);
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('parseChangedLines', () => {
  it('maps each hunk to its new-side lines and skips removal-only hunks', () => {
    const diff = [
      'diff --git a/app/src/a.ts b/app/src/a.ts',
      'index 1111111..2222222 100644',
      '--- a/app/src/a.ts',
      '+++ b/app/src/a.ts',
      '@@ -3 +3 @@ const a = 1;',
      '-old',
      '+new',
      '@@ -10,0 +11,3 @@',
      '+one',
      '+two',
      '+three',
      '@@ -20,2 +23,0 @@',
      '-gone',
      '-gone',
    ].join('\n');
    expect(parseChangedLines(diff)).toEqual(
      new Map([
        [
          'app/src/a.ts',
          [
            { start: 3, end: 3 },
            { start: 11, end: 13 },
          ],
        ],
      ]),
    );
  });

  it('names a moved file by its new path with only the lines changed after the move', () => {
    const diff = [
      'diff --git a/app/src/old/a.ts b/app/src/new/a.ts',
      'similarity index 100%',
      'rename from app/src/old/a.ts',
      'rename to app/src/new/a.ts',
      'diff --git a/app/src/old/b.ts b/app/src/new/b.ts',
      'similarity index 90%',
      'rename from app/src/old/b.ts',
      'rename to app/src/new/b.ts',
      'index 1111111..2222222 100644',
      '--- a/app/src/old/b.ts',
      '+++ b/app/src/new/b.ts',
      '@@ -4 +4,2 @@',
      '-x',
      '+y',
      '+z',
    ].join('\n');
    expect(parseChangedLines(diff)).toEqual(
      new Map([
        ['app/src/new/a.ts', []],
        ['app/src/new/b.ts', [{ start: 4, end: 5 }]],
      ]),
    );
  });

  it('reads an added line that looks like a file header as content', () => {
    const diff = [
      'diff --git a/app/src/a.ts b/app/src/a.ts',
      '--- a/app/src/a.ts',
      '+++ b/app/src/a.ts',
      '@@ -1,0 +2,2 @@',
      '+++ b/app/src/other.ts',
      '+rename to app/src/other.ts',
    ].join('\n');
    expect(parseChangedLines(diff)).toEqual(
      new Map([['app/src/a.ts', [{ start: 2, end: 3 }]]]),
    );
  });
});

describe('changedLinesAgainst', () => {
  let repository: string;
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=test',
        '-c',
        'user.email=test@example.com',
        '-c',
        'commit.gpgsign=false',
        ...args,
      ],
      { cwd: repository, encoding: 'utf8' },
    );
  const write = (file: string, lines: string[]) => {
    mkdirSync(path.dirname(path.join(repository, file)), { recursive: true });
    writeFileSync(path.join(repository, file), `${lines.join('\n')}\n`);
  };
  // `git mv` needs the target directory to exist.
  const move = (from: string, to: string) => {
    mkdirSync(path.dirname(path.join(repository, to)), { recursive: true });
    git('mv', from, to);
  };
  const SOURCE = Array.from({ length: 12 }, (_, index) => `line ${index + 1}`);

  beforeEach(() => {
    repository = mkdtempSync(path.join(tmpdir(), 'mutation-check-diff-'));
    git('init', '--quiet', '--initial-branch=main');
    // A user setting that turns rename detection off must not count a moved file as new.
    git('config', 'diff.renames', 'false');
    write('app/src/old/viewer.ts', SOURCE);
    git('add', '.');
    git('commit', '--quiet', '-m', 'base');
    git('switch', '--quiet', '--create', 'fix/move');
  });
  afterEach(() => {
    rmSync(repository, { recursive: true, force: true });
  });

  it('reports no changed line for a file only moved with git mv, committed or staged', () => {
    move('app/src/old/viewer.ts', 'app/src/new/viewer.ts');
    const staged = changedLinesAgainst({
      cwd: repository,
      base: 'main',
      paths: ['app'],
    });
    git('commit', '--quiet', '-m', 'move');
    const committed = changedLinesAgainst({
      cwd: repository,
      base: 'main',
      paths: ['app'],
    });
    const expected = new Map([['app/src/new/viewer.ts', []]]);
    expect(staged).toEqual(expected);
    expect(committed).toEqual(expected);
  });

  it('reports only the lines changed in a moved file', () => {
    move('app/src/old/viewer.ts', 'app/src/new/viewer.ts');
    git('commit', '--quiet', '-m', 'move');
    write(
      'app/src/new/viewer.ts',
      SOURCE.map((line, index) => (index === 6 ? 'line 7 changed' : line)),
    );
    expect(
      changedLinesAgainst({ cwd: repository, base: 'main', paths: ['app'] }),
    ).toEqual(new Map([['app/src/new/viewer.ts', [{ start: 7, end: 7 }]]]));
  });

  it('leaves out deleted files and files outside the given paths', () => {
    write('scripts/tool.ts', ['changed']);
    git('rm', '--quiet', 'app/src/old/viewer.ts');
    expect(
      changedLinesAgainst({ cwd: repository, base: 'main', paths: ['app'] }),
    ).toEqual(new Map());
  });
});

describe('parseChangedLines headers and hunks', () => {
  it('reads no path from a +++ line that no diff --git header precedes', () => {
    expect(parseChangedLines('+++ b/orphan.ts\n@@ -1 +1 @@\n+x').size).toBe(0);
  });

  it('reads a path only from the start of a header line', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      'index 1..2 100644',
      '--- a/a.ts',
      'prefix +++ b/evil.ts',
      '+++ b/a.ts',
      '@@ -1 +1 @@',
      '+x',
    ].join('\n');

    expect([...parseChangedLines(diff).keys()]).toEqual(['a.ts']);
  });

  it('ignores a hunk header written inside an added line', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '+++ b/a.ts',
      '@@ -1 +1 @@',
      '+see @@ -1 +9,4 @@ in the docs',
    ].join('\n');

    expect(parseChangedLines(diff).get('a.ts')).toEqual([{ start: 1, end: 1 }]);
  });

  it('reads a hunk of ten or more lines whole', () => {
    const diff = [
      'diff --git a/a.ts b/a.ts',
      '+++ b/a.ts',
      '@@ -1,12 +5,12 @@',
    ].join('\n');

    expect(parseChangedLines(diff).get('a.ts')).toEqual([
      { start: 5, end: 16 },
    ]);
  });
});
