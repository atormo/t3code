import { isThreadWorking } from "@t3tools/client-runtime/state/thread-inbox";
import { useEffect } from "react";

import { useClientSettings } from "../hooks/useSettings";
import { useThreadShells } from "../state/entities";

/** Asks the desktop shell to hold off sleep while any agent is working. */
export function KeepAwakeCoordinator() {
  const enabled = useClientSettings((settings) => settings.keepAwakeWhileAgentsWork);
  const threads = useThreadShells(enabled);
  const active = enabled && threads.some(isThreadWorking);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- mirrors the working state into the Electron power-save blocker
  useEffect(() => {
    void window.desktopBridge?.setKeepAwake(active).catch(() => undefined);
  }, [active]);

  return null;
}
