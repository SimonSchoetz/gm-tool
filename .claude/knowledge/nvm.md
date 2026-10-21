# nvm

## `nvm use --silent` with no version, run after sourcing `~/.nvm/nvm.sh`, switches the shell to the version `.nvmrc` names, while `nvm exec --silent <command>` with no version fails

**Verified at:** nvm as installed at `~/.nvm` — 2026-10-21
**Citation:** [refine-1-follow-ups_7: ran `env -i HOME=$HOME PATH=/usr/bin:/bin:$HOME/.nvm/versions/node/v22.23.2/bin bash -c '. "$HOME/.nvm/nvm.sh" && nvm use --silent && node --version && command -v pnpm && pnpm --dir app exec node --version'` at the repository root, whose `.nvmrc` holds `24` — observed `v24.21.0`, `~/.nvm/versions/node/v24.21.0/bin/pnpm`, `v24.21.0`; the same shell with `nvm exec --silent node --version` — observed `nvm-exec: line 20: exec: --: invalid option`, exit 2] [refine-1-follow-ups_8: ran `cat ~/.nvm/alias/default` — observed `22.23.2`]

The `default` alias on this machine names 22.23.2, so a process that takes its Node from nvm's default gets v22 unless it runs `nvm use` in the repository first.
