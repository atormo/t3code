import { isThreadWorking } from "@t3tools/client-runtime/state/thread-inbox";
import {
  ProviderDriverKind,
  type McpServerActionInput,
  type McpStatusResult,
  type ProviderMcpServer,
} from "@t3tools/contracts";
import { EllipsisIcon, PlugIcon, RotateCwIcon } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { ProviderInstanceIcon } from "../../components/chat/ProviderInstanceIcon";
import { Button } from "../../components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover";
import { useThreadRouteTarget } from "../../hooks/useThreadRouteTarget";
import { cn } from "../../lib/utils";
import { readLocalApi } from "../../localApi";
import { useQuietThreadShell } from "../../state/entities";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { mcpBarSummary, mcpServerLabel, MCP_STATUS_LABEL, sortMcpServers } from "./mcpStatus.logic";

const DOT_CLASS: Record<ProviderMcpServer["status"], string> = {
  connected: "bg-success",
  "needs-auth": "bg-warning",
  failed: "bg-destructive",
  pending: "bg-muted-foreground/50",
  disabled: "bg-muted-foreground/50",
};

function StatusDot({ status }: { status: ProviderMcpServer["status"] }) {
  return <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT_CLASS[status])} />;
}

/** The thread's MCP servers: a count in the bar, and their status and actions when opened. */
export function McpStatusItem() {
  const routeTarget = useThreadRouteTarget();
  const threadRef = routeTarget?.kind === "server" ? routeTarget.threadRef : null;
  const shell = useQuietThreadShell(threadRef);
  const working = shell !== null && isThreadWorking(shell);
  const getStatus = useAtomCommand(serverEnvironment.getMcpStatus, { reportFailure: false });
  const runAction = useAtomCommand(serverEnvironment.runMcpServerAction, { reportFailure: true });
  const [loaded, setLoaded] = useState<{ key: string; value: McpStatusResult } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const threadKey = threadRef === null ? null : `${threadRef.environmentId}:${threadRef.threadId}`;
  // A result from another thread never shows while this one loads.
  const result = loaded !== null && loaded.key === threadKey ? loaded.value : null;

  const refresh = () => {
    if (threadRef === null || threadKey === null) return;
    void getStatus({ environmentId: threadRef.environmentId, input: threadRef }).then((next) => {
      if (next._tag === "Success") setLoaded({ key: threadKey, value: next.value });
    });
  };
  const refreshFromEffect = useEffectEvent(refresh);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync, react/exhaustive-effect-dependencies -- asks the provider session again when the thread changes or a turn starts or ends
  useEffect(() => refreshFromEffect(), [threadKey, working]);

  if (threadRef === null) return null;

  const act = async (server: ProviderMcpServer, action: McpServerActionInput["action"]) => {
    if (action === "remove") {
      const confirmed =
        (await readLocalApi()?.dialogs.confirm(
          `Remove ${server.name} from your ${server.scope ?? ""} MCP config? Every thread loses it, not just this one.`,
          { variant: "destructive" },
        )) ?? false;
      if (!confirmed) return;
    }
    setBusy(server.name);
    await runAction({
      environmentId: threadRef.environmentId,
      input: { threadId: threadRef.threadId, name: server.name, action },
    });
    setBusy(null);
    refresh();
  };

  const showActions = async (server: ProviderMcpServer, position: { x: number; y: number }) => {
    const api = readLocalApi();
    if (!api) return;
    const removable =
      server.scope === "user" || server.scope === "project" || server.scope === "local";
    const clicked = await api.contextMenu
      .show(
        [
          { id: "reconnect", label: "Reconnect" },
          server.status === "disabled"
            ? { id: "enable", label: "Enable in this project" }
            : { id: "disable", label: "Disable in this project" },
          {
            id: "remove",
            label: removable ? "Remove from config…" : "Remove (managed by a plugin or account)",
            destructive: true,
            disabled: !removable,
            separatorBefore: true,
          },
        ],
        position,
      )
      .catch(() => null);
    if (
      clicked === "reconnect" ||
      clicked === "enable" ||
      clicked === "disable" ||
      clicked === "remove"
    ) {
      await act(server, clicked);
    }
  };

  const servers = sortMcpServers(result?.servers ?? []);
  const summary = mcpBarSummary(servers);

  return (
    <Popover onOpenChange={(open) => open && refresh()}>
      <PopoverTrigger
        render={
          <Button
            size="micro"
            variant="ghost-muted"
            aria-label={`MCP servers: ${summary.connected} of ${servers.length} connected`}
          />
        }
      >
        <PlugIcon aria-hidden />
        <span className="tabular-nums">
          MCP{servers.length > 0 ? ` ${summary.connected}/${servers.length}` : ""}
        </span>
        {summary.attention !== null ? <StatusDot status={summary.attention} /> : null}
      </PopoverTrigger>
      <PopoverPopup side="top" align="end" sideOffset={8} className="w-80">
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-medium text-sm">MCP servers</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {result?.driver ? (
                <ProviderInstanceIcon
                  driverKind={ProviderDriverKind.make(result.driver)}
                  displayName={result.driver}
                  size="compact"
                />
              ) : null}
              {result?.state === "live"
                ? `${summary.connected} of ${servers.length} connected`
                : null}
            </span>
          </div>
          {result === null ? (
            <p className="py-2 text-muted-foreground">Loading…</p>
          ) : result.state === "no-session" ? (
            <p className="py-2 text-muted-foreground">
              Shows once the agent runs in this thread. Send a message to start it.
            </p>
          ) : result.state === "unsupported" ? (
            <p className="py-2 text-muted-foreground">
              This provider does not report its MCP servers.
            </p>
          ) : servers.length === 0 ? (
            <p className="py-2 text-muted-foreground">No MCP servers configured.</p>
          ) : (
            <ul className="flex max-h-80 flex-col overflow-y-auto">
              {servers.map((server) => (
                <li
                  key={server.name}
                  className="group/mcp flex items-start gap-2 rounded-md px-1.5 py-1 hover:bg-accent"
                >
                  <span className="pt-1.5">
                    <StatusDot status={server.status} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">
                      {mcpServerLabel(server.name).title}
                    </span>
                    {mcpServerLabel(server.name).origin ? (
                      <span className="truncate text-muted-foreground/70">
                        {mcpServerLabel(server.name).origin}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "text-muted-foreground",
                        server.status === "failed" && "text-destructive-foreground",
                      )}
                    >
                      {server.status === "connected"
                        ? `${server.toolCount} ${server.toolCount === 1 ? "tool" : "tools"}`
                        : (server.error ?? MCP_STATUS_LABEL[server.status])}
                    </span>
                  </span>
                  <Button
                    size="icon-xs"
                    variant="ghost-muted"
                    aria-label={`Actions for ${server.name}`}
                    disabled={busy === server.name}
                    onClick={(event) =>
                      void showActions(server, { x: event.clientX, y: event.clientY })
                    }
                  >
                    <EllipsisIcon aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between border-t pt-2 text-muted-foreground">
            <span>Updates when a turn starts or ends</span>
            <Button size="micro" variant="ghost-muted" onClick={refresh}>
              <RotateCwIcon aria-hidden />
              Refresh
            </Button>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
