import { execSync } from 'child_process';
import pkg from '../app/package.json' with { type: 'json' };

const { version } = pkg;

execSync('git push origin main', { stdio: 'inherit' });
execSync(`git tag v${version}`, { stdio: 'inherit' });
// The tag names the commit the push of main above just ran the pre-push checks on, so its own push skips them through simple-git-hooks' skip variable.
execSync(`git push origin v${version}`, {
  stdio: 'inherit',
  env: { ...process.env, SKIP_SIMPLE_GIT_HOOKS: '1' },
});
