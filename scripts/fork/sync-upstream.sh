#!/usr/bin/env bash
# Brings the latest pingdotgg/t3code into this fork's main, then proves the fork still works.
#
#   scripts/fork/sync-upstream.sh            merge, install, check
#   scripts/fork/sync-upstream.sh --install  also rebuild and reinstall the Mac app
#
# It merges (never rebases), so main can always be pushed without force. When a merge clashes or
# the fork checks fail, it offers to open Claude Code here to fix it (following FORK.md) and then
# carries on. Without Claude Code it stops and leaves the merge for you, as before.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

install_app=false
if [[ "${1:-}" == "--install" ]]; then install_app=true; fi

. scripts/fork/lib.sh

# Opens Claude Code in this Terminal with a task; returns when the user closes it.
fix_with_claude() {
  if ! command -v claude >/dev/null 2>&1; then return 1; fi
  ask "¿Abrir Claude Code para arreglarlo? [S/n]" s || return 1
  # Claude Code needs the Terminal's own stdin: redirecting /dev/tty breaks its file watcher.
  claude "$1" || true
}

if [[ -e .git/MERGE_HEAD ]]; then
  echo "A merge is already in progress; finishing it first."
elif [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Working tree has uncommitted changes. Commit or stash them first." >&2
  exit 1
fi

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Run this on main." >&2
  exit 1
fi

git remote get-url upstream >/dev/null 2>&1 ||
  git remote add upstream https://github.com/pingdotgg/t3code.git

if [[ ! -e .git/MERGE_HEAD ]]; then
  echo "==> Fetching upstream"
  git fetch --no-tags upstream main

  behind="$(git rev-list --count HEAD..upstream/main)"
  if [[ "$behind" == "0" ]]; then
    echo "Already up to date with upstream."
  else
    echo "==> Merging $behind upstream commits"
    git merge --no-edit upstream/main || true
  fi
fi

if [[ -e .git/MERGE_HEAD ]]; then
  conflicts="$(git diff --name-only --diff-filter=U)"
  if [[ -n "$conflicts" ]]; then
    echo >&2
    echo "Merge conflicts in:" >&2
    echo "$conflicts" >&2
    echo >&2
    fix_with_claude "Estoy fusionando pingdotgg/t3code (upstream/main) en este fork y hay conflictos en:
$conflicts

Resuélvelos siguiendo FORK.md: conserva el cambio de t3code y vuelve a aplicar encima la parte del fork, que siempre es pequeña (mira 'git diff \$(git merge-base HEAD upstream/main) HEAD -- <archivo>' para ver qué añadió el fork). apps/web/src/routeTree.gen.ts es generado: toma la versión de t3code y regenéralo. Cuando no quede ninguno, haz 'git add' y 'git commit --no-edit'. No hagas push. Si no ves clara alguna decisión, pregúntame." ||
      true
    if [[ -e .git/MERGE_HEAD ]]; then
      echo "The merge is still unfinished. Resolve it (FORK.md says what each fork change does), commit, and run this again." >&2
      exit 2
    fi
  else
    git commit --no-edit
  fi
fi

echo "==> Installing dependencies"
ensure_dependencies

until scripts/fork/check.sh; do
  echo >&2
  echo "The fork checks failed after the update." >&2
  fix_with_claude "Acabo de fusionar pingdotgg/t3code en este fork y 'scripts/fork/check.sh' falla (tipos, tests o lint). Ejecútalo, arregla los errores siguiendo las reglas de FORK.md (cambios mínimos en archivos de t3code, la parte del fork encima) y haz commit con los arreglos. No hagas push." ||
    {
      echo "Fix the failures, commit, and run this again." >&2
      exit 4
    }
done

if [[ "$install_app" == true ]]; then
  scripts/fork/install-app.sh
fi

echo
if [[ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]] && ask "¿Subir el fork a GitHub? [S/n]" s; then
  git push origin main
else
  echo "Done. Push when ready: git push origin main"
fi
