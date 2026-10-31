#!/usr/bin/env bash
# Checks that keep the fork's own features working after an upstream merge.
# Typechecks every package the fork touches and runs the tests that cover fork code.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "==> Typecheck"
vp run \
  --filter @t3tools/contracts \
  --filter @t3tools/client-runtime \
  --filter t3 \
  --filter @t3tools/web \
  --filter @t3tools/desktop \
  typecheck

echo "==> Fork tests"
vp test run \
  apps/server/src/notes/Notes.test.ts \
  apps/web/src/uiStateStore.test.ts \
  apps/web/src/components/Sidebar.logic.test.ts \
  apps/server/src/ws.test.ts

echo "==> Lint fork code"
vp lint apps/web/src/fork apps/server/src/notes apps/desktop/src/ipc/methods/keepAwake.ts

echo "Fork checks passed."
