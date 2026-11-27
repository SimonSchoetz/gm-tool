// Takes the path of a commit message file, as git passes it to the `commit-msg` hook: exits 1 and prints the refusal to standard error when `./commit-msg-check-validate.ts` refuses the subject on the current branch. It never edits the file.
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { commitMessageRefusal } from './commit-msg-check-validate.ts';

// Empty on a detached HEAD, where `git symbolic-ref` exits non-zero.
const currentBranch = () => {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
};

const refusal = commitMessageRefusal({
  message: readFileSync(process.argv[2], 'utf8'),
  branch: currentBranch(),
  // Git runs its commit hooks with `GIT_EDITOR=:` when the command opens no editor.
  editorOpened: process.env.GIT_EDITOR !== ':',
});

if (refusal !== null) {
  console.error(refusal);
  process.exit(1);
}
