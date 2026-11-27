// Throwaway folders, git repositories and commit message files for tests that run a script or a hook which reads the branch or a message file. A test calls `unsetGitEnvironment` (./isolated-git.ts) before it runs git in one.
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

// The caller removes the folder when its test ends.
export const createScratchFolder = () =>
  mkdtempSync(path.join(tmpdir(), 'scratch-repository-'));

// The branch stays unborn: `git symbolic-ref` names it before any commit.
export const initRepositoryOnBranch = (folder: string, branch: string) => {
  execFileSync('git', ['init', '--quiet', `--initial-branch=${branch}`], {
    cwd: folder,
  });
};

export const writeMessageFile = (folder: string, message: string) => {
  const file = path.join(folder, 'COMMIT_EDITMSG');
  writeFileSync(file, message);
  return file;
};
