import { useEffect, useRef } from "react";

import { useClientSettings } from "../../hooks/useSettings";

/** Applies the chosen Mac app icon. A first-run default leaves any icon set in Finder alone. */
export function AppIconSync() {
  const icon = useClientSettings((settings) => settings.appIcon);
  const applied = useRef(false);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- pushes the icon choice to the Electron Dock and app bundle
  useEffect(() => {
    const firstRun = !applied.current;
    applied.current = true;
    if (firstRun && icon === "black") return;
    void window.desktopBridge?.setAppIcon(icon).catch(() => undefined);
  }, [icon]);
  return null;
}
