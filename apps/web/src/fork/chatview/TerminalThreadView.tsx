import { useEffect } from "react";

import { useClientSettings } from "../../hooks/useSettings";
import "./terminalThreadView.css";

/** Turns the terminal thread style on or off by marking the document root. */
export function TerminalThreadViewSync() {
  const enabled = useClientSettings((settings) => settings.terminalThreadView);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- mirrors the setting onto <html>, which the thread CSS scopes to
  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.dataset.forkChatView = "terminal";
    else delete root.dataset.forkChatView;
  }, [enabled]);
  return null;
}
