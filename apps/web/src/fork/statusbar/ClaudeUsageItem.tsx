import type { ServerProviderUsageWindow, UsageProviderKind } from "@t3tools/contracts";
import { formatTokens, formatUsd, makeWindow } from "@t3tools/shared/usageFormat";
import { useNavigate } from "@tanstack/react-router";
import { GaugeIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { useEnvironmentProviders, usePrimaryEnvironmentId } from "../../state/environments";
import { useUsage } from "../../state/usage";

const CLAUDE_DRIVER = "claudeAgent";
const HIDE_ALL_BUT_CLAUDE: ReadonlySet<UsageProviderKind> = new Set<UsageProviderKind>([
  "codex",
  "grok",
  "cursor",
  "opencode",
  "antigravity",
  "pi",
  "muse",
]);

function windowLabel(window: ServerProviderUsageWindow): string {
  if (window.kind === "session") return "5h";
  if (window.label === "Weekly") return "Week";
  return window.label.replace(/^Weekly · /, "");
}

function UsageMeter({ percent }: { percent: number }) {
  return (
    <span aria-hidden className="relative h-1 w-6 overflow-hidden rounded-full bg-muted">
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          percent >= 90 ? "bg-error" : percent >= 70 ? "bg-warning" : "bg-info",
        )}
        style={{ width: `${Math.max(4, percent)}%` }}
      />
    </span>
  );
}

/** Today's Claude tokens and cost, plus how much of the plan's limit windows is used. */
export function ClaudeUsageItem() {
  const navigate = useNavigate();
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const providersByEnvironment = useEnvironmentProviders();
  // useUsage compares the window by identity, so keep one object per day.
  const [usageWindow, setUsageWindow] = useState(() => makeWindow(1));
  const today = makeWindow(1);
  if (usageWindow.sinceDay !== today.sinceDay) setUsageWindow(today);
  const usage = useUsage(usageWindow, null, HIDE_ALL_BUT_CLAUDE);
  const claude = (
    primaryEnvironmentId === null ? [] : (providersByEnvironment.get(primaryEnvironmentId) ?? [])
  ).find((provider) => provider.driver === CLAUDE_DRIVER);
  const windows = claude?.usageLimits?.windows ?? [];
  const spent = usage.shown?.merged ?? null;

  const spend =
    spent === null
      ? usage.isPending
        ? "…"
        : "No usage today"
      : `${formatTokens(spent.totalTokens)} · ${formatUsd(spent.costUsd)}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="micro"
            variant="ghost-muted"
            aria-label="Claude usage today. Open the Usage page."
            onClick={() => void navigate({ to: "/usage" })}
          />
        }
      >
        <GaugeIcon aria-hidden />
        <span>Claude today {spend}</span>
        {windows.map((window) => (
          <span key={window.id} className="ml-1.5 flex items-center gap-1 tabular-nums">
            {windowLabel(window)}
            <UsageMeter percent={window.usedPercent} />
            {Math.round(window.usedPercent)}%
          </span>
        ))}
      </TooltipTrigger>
      <TooltipPopup>
        <div className="space-y-1">
          <p>
            Claude today: {spent === null ? "no usage yet" : spend}. Cost is an estimate at API
            prices.
          </p>
          {windows.map((window) => (
            <p key={window.id}>
              {window.label}: {Math.round(window.usedPercent)}% used
              {window.resetsAt ? `, resets ${new Date(window.resetsAt).toLocaleString()}` : ""}
            </p>
          ))}
        </div>
      </TooltipPopup>
    </Tooltip>
  );
}
