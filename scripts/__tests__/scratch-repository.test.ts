import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { readFileSync, rmSync } from 'fs';
import { unsetGitEnvironment } from './support/isolated-git.ts';
import {
  createScratchFolder,
  initRepositoryOnBranch,
  writeMessageFile,
} from './support/scratch-repository.ts';

describe('scratch repository', () => {
  let folder: string;

  beforeEach(() => {
    unsetGitEnvironment();
    folder = createScratchFolder();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(folder, { recursive: true, force: true });
  });

  it('puts HEAD on the branch asked for before any commit, so a test of a branch rule cannot run on another branch', () => {
    initRepositoryOnBranch(folder, 'feat/example');

    const branch = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      cwd: folder,
      encoding: 'utf8',
    });

    expect(branch).toBe('feat/example\n');
  });

  it('returns the path of a message file that holds the message unchanged', () => {
    const message = '#1 first\n\nsecond  \n';

    expect(readFileSync(writeMessageFile(folder, message), 'utf8')).toBe(
      message,
    );
  });
});
