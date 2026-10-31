import type { ServerProvider, ServerProviderUsageWindow } from "@t3tools/contracts";
import { formatDuration, formatResetsIn } from "@t3tools/shared/usageLimits";
import { useNavigate } from "@tanstack/react-router";
import { Fragment } from "react";

import { ProviderInstanceIcon } from "../../components/chat/ProviderInstanceIcon";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { useNowMinute } from "../../hooks/useNowMinute";
import { cn } from "../../lib/utils";
import { useEnvironmentProviders, usePrimaryEnvironmentId } from "../../state/environments";

const NO_PROVIDERS: readonly ServerProvider[] = [];

/** "5h 12m" until a plain window resets; a model-scoped window ("Weekly · Fable") shows its model. */
function windowDetail(window: ServerProviderUsageWindow, now: number): string | null {
  const scoped = /^Weekly · (.+)$/.exec(window.label);
  if (scoped) return scoped[1] ?? null;
  if (!window.resetsAt) return null;
  const left = Date.parse(window.resetsAt) - now;
  return left > 0 ? formatDuration(left) : null;
}

function UsageMeter({ percent }: { percent: number }) {
  return (
    <span aria-hidden className="relative h-1.5 w-10 overflow-hidden rounded-full bg-foreground/12">
      <span
        className={cn(
          "absolute inset-y-0 left-0 rounded-full",
          percent >= 90 ? "bg-error" : percent >= 70 ? "bg-warning" : "bg-foreground/60",
        )}
        style={{ width: `${Math.max(4, percent)}%` }}
      />
    </span>
  );
}

function ProviderLimits({ provider, now }: { provider: ServerProvider; now: number }) {
  const navigate = useNavigate();
  const windows = provider.usageLimits?.windows ?? [];
  const name = provider.displayName ?? provider.driver;
  const busiest = Math.max(...windows.map((window) => window.usedPercent));

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="micro"
            variant="ghost-muted"
            aria-label={`${name} usage limits. Open the Usage page.`}
            onClick={() => void navigate({ to: "/usage" })}
          />
        }
      >
        <ProviderInstanceIcon
          driverKind={provider.driver}
          displayName={name}
          accentColor={provider.accentColor}
        />
        <UsageMeter percent={busiest} />
        <span className="tabular-nums">
          {windows.map((window, index) => {
            const detail = windowDetail(window, now);
            return (
              <Fragment key={window.id}>
                {index > 0 ? <span className="px-1 text-muted-foreground/60">·</span> : null}
                <span className="text-foreground">{Math.round(window.usedPercent)}%</span>
                {detail ? <span className="ml-1">{detail}</span> : null}
              </Fragment>
            );
          })}
        </span>
      </TooltipTrigger>
      <TooltipPopup>
        <div className="space-y-1">
          <p className="font-medium">{name}</p>
          {windows.map((window) => {
            const resets = formatResetsIn(window, now);
            return (
              <p key={window.id}>
                {window.label}: {Math.round(window.usedPercent)}% used
                {resets ? `, ${resets}` : ""}
              </p>
            );
          })}
        </div>
      </TooltipPopup>
    </Tooltip>
  );
}

/** Each provider's plan limits: how much is used and how long until each window resets. */
export function UsageLimitsItem() {
  // The tick is a UTC "YYYY-MM-DDTHH:mm" string, so mark it UTC before parsing.
  const now = Date.parse(`${useNowMinute()}Z`);
  const primaryEnvironmentId = usePrimaryEnvironmentId();
  const providersByEnvironment = useEnvironmentProviders();
  const providers = (
    primaryEnvironmentId === null
      ? NO_PROVIDERS
      : (providersByEnvironment.get(primaryEnvironmentId) ?? NO_PROVIDERS)
  ).filter((provider) => (provider.usageLimits?.windows.length ?? 0) > 0);

  if (providers.length === 0) return null;
  return (
    <div className="flex min-w-0 items-center gap-0.5 overflow-hidden">
      <span className="px-1 text-2xs text-muted-foreground">Used</span>
      {providers.map((provider) => (
        <ProviderLimits key={provider.instanceId} provider={provider} now={now} />
      ))}
    </div>
  );
}
