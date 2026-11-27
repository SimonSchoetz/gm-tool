import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawnSync } from 'child_process';
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import { unsetGitEnvironment } from './support/isolated-git.ts';
import {
  createScratchFolder,
  writeMessageFile,
} from './support/scratch-repository.ts';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');

const { 'simple-git-hooks': hooks } = JSON.parse(
  readFileSync(path.join(REPOSITORY_ROOT, 'package.json'), 'utf8'),
) as { 'simple-git-hooks': { 'commit-msg': string } };

describe('the commit-msg hook command of package.json', () => {
  let checkout: string;

  beforeEach(() => {
    unsetGitEnvironment();
    checkout = createScratchFolder();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(checkout, { recursive: true, force: true });
  });

  const addCheckScript = () => {
    mkdirSync(path.join(checkout, 'scripts'));
    for (const script of [
      'commit-msg-check.ts',
      'commit-msg-check-validate.ts',
    ]) {
      copyFileSync(
        path.join(REPOSITORY_ROOT, 'scripts', script),
        path.join(checkout, 'scripts', script),
      );
    }
    writeFileSync(path.join(checkout, 'package.json'), '{"type":"module"}');
  };

  // Git passes the path of the message file as the hook's first argument. The folder name holds a space, as a path to a git directory can.
  const runHook = (message: string) => {
    const gitDirectory = path.join(checkout, 'git directory');
    mkdirSync(gitDirectory, { recursive: true });
    return spawnSync(
      'sh',
      [
        '-c',
        hooks['commit-msg'],
        'commit-msg',
        writeMessageFile(gitDirectory, message),
      ],
      { cwd: checkout, encoding: 'utf8' },
    );
  };

  it('lets any commit through in silence in a checkout without the check script, which shares the installed hook', () => {
    expect(runHook('update backlog\n')).toMatchObject({
      status: 0,
      stdout: '',
      stderr: '',
    });
  });

  it('refuses a subject outside the form once the check script is in the checkout', () => {
    addCheckScript();

    const { status, stderr } = runHook('update backlog\n');

    expect(status).toBe(1);
    expect(stderr).toContain('refused "update backlog"');
  });

  it('lets a subject in the form through once the check script is in the checkout', () => {
    addCheckScript();

    expect(runHook('chore(backlog): update it\n')).toMatchObject({
      status: 0,
      stderr: '',
    });
  });
});
