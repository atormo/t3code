import type { ProviderMcpServer } from "@t3tools/contracts";

export const MCP_STATUS_LABEL: Record<ProviderMcpServer["status"], string> = {
  connected: "Connected",
  "needs-auth": "Needs sign-in",
  failed: "Failed to connect",
  pending: "Connecting…",
  disabled: "Disabled",
};

/** How many are connected, and the most urgent status to flag in the bar (null when all is well). */
export function mcpBarSummary(servers: readonly ProviderMcpServer[]): {
  readonly connected: number;
  readonly attention: "failed" | "needs-auth" | null;
} {
  return {
    connected: servers.filter((server) => server.status === "connected").length,
    attention: servers.some((server) => server.status === "failed")
      ? "failed"
      : servers.some((server) => server.status === "needs-auth")
        ? "needs-auth"
        : null,
  };
}

/** `plugin:customer-support:slack` reads as `slack` from the customer-support plugin. */
export function mcpServerLabel(name: string): {
  readonly title: string;
  readonly origin: string | null;
} {
  const plugin = /^plugin:([^:]+):(.+)$/.exec(name);
  return plugin
    ? { title: plugin[2]!, origin: `${plugin[1]} plugin` }
    : { title: name, origin: null };
}

const STATUS_ORDER: Record<ProviderMcpServer["status"], number> = {
  connected: 0,
  pending: 1,
  "needs-auth": 2,
  failed: 3,
  disabled: 4,
};

/** Connected first, then the ones that need you, then the switched off; by name within each. */
export function sortMcpServers(servers: readonly ProviderMcpServer[]): ProviderMcpServer[] {
  return [...servers].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      mcpServerLabel(a.name).title.localeCompare(mcpServerLabel(b.name).title),
  );
}
