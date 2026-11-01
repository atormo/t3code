import * as Schema from "effect/Schema";

import { ThreadId } from "./baseSchemas.ts";

/** One MCP server as the thread's provider session sees it. */
export const ProviderMcpServer = Schema.Struct({
  name: Schema.String,
  status: Schema.Literals(["connected", "failed", "needs-auth", "pending", "disabled"]),
  error: Schema.optional(Schema.String),
  /** Where it is configured: user, project, local, plugin, claudeai, … */
  scope: Schema.optional(Schema.String),
  toolCount: Schema.Number,
});
export type ProviderMcpServer = typeof ProviderMcpServer.Type;

export const McpStatusInput = Schema.Struct({ threadId: ThreadId });
export type McpStatusInput = typeof McpStatusInput.Type;

export const McpStatusResult = Schema.Struct({
  /** `no-session` until the agent runs in this thread; `unsupported` for providers without it. */
  state: Schema.Literals(["live", "no-session", "unsupported"]),
  driver: Schema.optional(Schema.String),
  servers: Schema.Array(ProviderMcpServer),
});
export type McpStatusResult = typeof McpStatusResult.Type;

export const McpServerActionInput = Schema.Struct({
  threadId: ThreadId,
  name: Schema.String,
  action: Schema.Literals(["reconnect", "enable", "disable", "remove"]),
});
export type McpServerActionInput = typeof McpServerActionInput.Type;

export class McpStatusError extends Schema.TaggedError<McpStatusError>()("McpStatusError", {
  reason: Schema.String,
}) {
  override get message(): string {
    return this.reason;
  }
}
