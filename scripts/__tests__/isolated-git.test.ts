import { describe, it, expect, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { unsetGitEnvironment } from './support/isolated-git.ts';

describe('unsetGitEnvironment', () => {
  const folders: string[] = [];
  const folder = (prefix: string) => {
    const created = mkdtempSync(path.join(tmpdir(), prefix));
    folders.push(created);
    return created;
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const created of folders.splice(0)) {
      rmSync(created, { recursive: true, force: true });
    }
  });

  it('keeps git init in a scratch folder from writing into the repository a hook names in GIT_DIR', () => {
    const hookGitDirectory = folder('isolated-git-hook-');
    vi.stubEnv('GIT_DIR', hookGitDirectory);
    vi.stubEnv('GIT_INDEX_FILE', path.join(hookGitDirectory, 'index'));
    const scratch = folder('isolated-git-scratch-');

    unsetGitEnvironment();
    execFileSync('git', ['init', '--quiet'], { cwd: scratch });

    expect(readdirSync(hookGitDirectory)).toEqual([]);
    expect(existsSync(path.join(scratch, '.git', 'HEAD'))).toBe(true);
  });
});
