import { isThreadWorking } from "@t3tools/client-runtime/state/thread-inbox";
import { CoffeeIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "../../components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { updateClientSettings, useClientSettings } from "../../hooks/useSettings";
import { useThreadShells } from "../../state/entities";

/** Holds off sleep while any agent works, and shows whether it is doing so right now. */
export function KeepAwakeItem() {
  const enabled = useClientSettings((settings) => settings.keepAwakeWhileAgentsWork);
  const workingCount = useThreadShells().filter(isThreadWorking).length;
  const holding = enabled && workingCount > 0;

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- mirrors the working state into the Electron power-save blocker
  useEffect(() => {
    void window.desktopBridge?.setKeepAwake(holding).catch(() => undefined);
  }, [holding]);

  const label = !enabled
    ? "Keep awake is off"
    : holding
      ? `Keeping this computer awake: ${workingCount} ${workingCount === 1 ? "agent" : "agents"} working`
      : "Keep awake is on. It starts when an agent works.";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="micro"
            variant={holding ? "secondary" : "ghost-muted"}
            aria-label={label}
            aria-pressed={enabled}
            onClick={() => void updateClientSettings({ keepAwakeWhileAgentsWork: !enabled })}
          />
        }
      >
        <CoffeeIcon aria-hidden />
        <span>{enabled ? (holding ? "Awake" : "Keep awake") : "Sleep allowed"}</span>
      </TooltipTrigger>
      <TooltipPopup>{label}</TooltipPopup>
    </Tooltip>
  );
}
