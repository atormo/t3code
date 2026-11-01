import type { ProviderMcpServer } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { mcpBarSummary, mcpServerLabel, sortMcpServers } from "./mcpStatus.logic";

const server = (status: ProviderMcpServer["status"]): ProviderMcpServer => ({
  name: status,
  status,
  toolCount: 0,
});

describe("mcpBarSummary", () => {
  it("counts connected servers and flags the most urgent problem", () => {
    expect(mcpBarSummary([server("connected"), server("disabled")])).toEqual({
      connected: 1,
      attention: null,
    });
    expect(mcpBarSummary([server("needs-auth"), server("connected")]).attention).toBe("needs-auth");
    expect(mcpBarSummary([server("needs-auth"), server("failed")]).attention).toBe("failed");
  });
});

describe("mcpServerLabel and sortMcpServers", () => {
  it("names plugin servers by their own name and lists connected ones first", () => {
    expect(mcpServerLabel("plugin:customer-support:slack")).toEqual({
      title: "slack",
      origin: "customer-support plugin",
    });
    expect(mcpServerLabel("figma")).toEqual({ title: "figma", origin: null });
    const sorted = sortMcpServers([
      { name: "plugin:x:zeta", status: "failed", toolCount: 0 },
      { name: "beta", status: "connected", toolCount: 1 },
      { name: "alpha", status: "connected", toolCount: 1 },
    ]);
    expect(sorted.map((server) => server.name)).toEqual(["alpha", "beta", "plugin:x:zeta"]);
  });
});
