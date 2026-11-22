# Shared helpers for the fork scripts. Source it: . scripts/fork/lib.sh

# Asks a yes/no question; $2 is the answer when the user just presses Enter.
ask() {
  local reply
  read -r -p "$1 " reply </dev/tty || reply=""
  [[ -z "$reply" ]] && reply="$2"
  [[ "$reply" =~ ^[sSyY] ]]
}

# Installs dependencies. If the user's pnpm setting rejects packages that are too new, lists them
# and asks before allowing them for this run only (also for the app build, which installs again).
ensure_dependencies() {
  local log
  log="$(mktemp)"
  if vp i 2>&1 | tee "$log"; then
    rm -f "$log"
    return 0
  fi
  if ! grep -q "MINIMUM_RELEASE_AGE" "$log"; then
    rm -f "$log"
    return 1
  fi
  echo
  echo "Your pnpm setting rejects packages published in the last days. t3code's lockfile uses:"
  grep -E "was published at" "$log" | sed 's/^ */  /' || true
  rm -f "$log"
  if ! ask "¿Instalarlos igualmente solo esta vez? (tu ajuste global no cambia) [s/N]" n; then
    echo "Stopped. Run this again in a few days, when those packages are old enough." >&2
    return 3
  fi
  export pnpm_config_minimum_release_age=0
  vp i
}
