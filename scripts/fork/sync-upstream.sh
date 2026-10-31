#!/usr/bin/env bash
# Brings the latest pingdotgg/t3code into this fork's main, then proves the fork still works.
#
#   scripts/fork/sync-upstream.sh            merge, install, check
#   scripts/fork/sync-upstream.sh --install  also rebuild and reinstall the Mac app
#
# It merges (never rebases), so main can always be pushed without force. On a conflict it
# stops and leaves the merge in progress: resolve it with FORK.md, then run it again.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

install_app=false
if [[ "${1:-}" == "--install" ]]; then install_app=true; fi

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Working tree has uncommitted changes. Commit or stash them first." >&2
  exit 1
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Run this on main." >&2
  exit 1
fi

git remote get-url upstream >/dev/null 2>&1 ||
  git remote add upstream https://github.com/pingdotgg/t3code.git

echo "==> Fetching upstream"
git fetch upstream main

behind="$(git rev-list --count HEAD..upstream/main)"
if [[ "$behind" == "0" ]]; then
  echo "Already up to date with upstream."
else
  echo "==> Merging $behind upstream commits"
  if ! git merge --no-edit upstream/main; then
    echo >&2
    echo "Merge conflicts in:" >&2
    git diff --name-only --diff-filter=U >&2
    echo >&2
    echo "Resolve them (FORK.md says what each fork change does), commit, and run this again." >&2
    exit 2
  fi
fi

echo "==> Installing dependencies"
vp i

scripts/fork/check.sh

if [[ "$install_app" == true ]]; then
  scripts/fork/install-app.sh
fi

echo
echo "Done. Push when ready: git push origin main"
