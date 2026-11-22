#!/usr/bin/env bash
# Run by launchd every few hours (see setup-background-fetch.sh). Keeps upstream/main fresh so
# every update is a small download, records how far behind the fork is for the app's
# "Check for Updates", and sends a macOS notification when a batch of changes has piled up.
set -uo pipefail

repo="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repo" || exit 0
status_file="$HOME/.t3code-fork-status.json"
notified_file="$HOME/.t3code-fork-notified"
notify_every=50

# Never race a merge or another git command the user is running.
[[ -e .git/MERGE_HEAD || -e .git/index.lock ]] && exit 0

# Interrupted fetches leave half-written packs behind; old ones are safe to drop.
find .git/objects/pack -name 'tmp_pack_*' -mmin +60 -delete 2>/dev/null

git fetch --quiet --no-tags upstream main || exit 0
behind="$(git rev-list --count HEAD..upstream/main)"
printf '{"behind":%s,"checkedAt":"%s"}\n' "$behind" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >"$status_file"

last="$(cat "$notified_file" 2>/dev/null || echo 0)"
[[ "$behind" =~ ^[0-9]+$ && "$last" =~ ^[0-9]+$ ]] || last=0
if ((behind < last)); then last=0; fi # an update happened since the last notification
if ((behind >= notify_every && behind - last >= notify_every)); then
  osascript -e "display notification \"Abre T3 Code → Check for Updates para traerlos.\" with title \"t3code tiene $behind cambios nuevos\"" || true
  echo "$behind" >"$notified_file"
elif ((behind == 0)); then
  echo 0 >"$notified_file"
fi
