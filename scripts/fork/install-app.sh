#!/usr/bin/env bash
# Builds the Mac app from this checkout and replaces /Applications/T3 Code (Beta).app.
# The build has no update feed, so official releases never overwrite it.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

app_name="T3 Code (Beta)"
target="/Applications/${app_name}.app"

echo "==> Building the DMG"
rm -rf release
vp run dist:desktop:dmg
dmg="$(ls release/*.dmg | head -n 1)"

echo "==> Quitting ${app_name}"
osascript -e "quit app \"${app_name}\"" >/dev/null 2>&1 || true
for _ in $(seq 1 20); do
  pgrep -xq "${app_name}" || break
  sleep 1
done

echo "==> Installing"
volume="$(hdiutil attach -nobrowse -readonly "$dmg" | tail -n 1 | cut -f3)"
trap 'hdiutil detach "$volume" -quiet || true' EXIT
source_app="${volume}/${app_name}.app"
[[ -d "$source_app" ]] || { echo "No ${app_name}.app in ${dmg}" >&2; exit 1; }
if [[ -d "$target" ]]; then rm -rf "$target"; fi
ditto "$source_app" "$target"

# Lets the app's "Check for Updates" find this checkout.
printf '{"repo":"%s"}\n' "$(pwd)" >"$HOME/.t3code-fork.json"

open -a "$target"
echo "Installed ${target}."
