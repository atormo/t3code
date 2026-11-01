import {
  McpStatusError,
  type McpServerActionInput,
  type McpStatusResult,
  type ThreadId,
} from "@t3tools/contracts";
import type * as ProviderAdapter from "@t3tools/provider-core/server/ProviderAdapter";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";

import * as Orchestrator from "../orchestration-v2/Orchestrator.ts";
import * as ProviderSessionManager from "../orchestration-v2/ProviderSessionManager.ts";

/** Scopes `claude mcp remove` can edit; plugin and claude.ai servers are managed elsewhere. */
const REMOVABLE_SCOPES = new Set(["user", "project", "local"]);

/**
 * Fork: the MCP servers of a thread's live provider session. Never starts a session, so a
 * thread the agent has not run in since the server started reports `no-session`.
 */
export class McpStatus extends Context.Service<
  McpStatus,
  {
    readonly get: (threadId: ThreadId) => Effect.Effect<McpStatusResult, McpStatusError>;
    readonly act: (input: McpServerActionInput) => Effect.Effect<void, McpStatusError>;
  }
>()("t3/mcpStatus/McpStatus") {}

const make = Effect.gen(function* () {
  const orchestrator = yield* Orchestrator.OrchestratorV2;
  const providerSessions = yield* ProviderSessionManager.ProviderSessionManagerV2;
  const failed = (reason: string) => () => new McpStatusError({ reason });

  const liveRuntime = Effect.fn("McpStatus.liveRuntime")(function* (threadId: ThreadId) {
    const records = yield* orchestrator
      .getThreadRecords(threadId, ["providerThreads"])
      .pipe(Effect.mapError(failed("Could not read the thread.")));
    const providerThread = records.providerThreads.find(
      (candidate) => candidate.id === records.thread.activeProviderThreadId,
    );
    if (providerThread?.providerSessionId == null) return null;
    const runtime = yield* providerSessions
      .get(providerThread.providerSessionId)
      .pipe(Effect.mapError(failed("Could not reach the provider session.")));
    return Option.getOrNull(runtime);
  });

  const get = Effect.fn("McpStatus.get")(function* (threadId: ThreadId) {
    const runtime = yield* liveRuntime(threadId);
    if (runtime === null) return { state: "no-session", servers: [] } satisfies McpStatusResult;
    if (runtime.mcpServers === undefined) {
      return {
        state: "unsupported",
        driver: runtime.driver,
        servers: [],
      } satisfies McpStatusResult;
    }
    const servers = yield* runtime.mcpServers.status.pipe(
      Effect.mapError(failed("The provider did not report its MCP servers.")),
    );
    return {
      state: "live",
      driver: runtime.driver,
      servers: [...servers],
    } satisfies McpStatusResult;
  });

  const act = Effect.fn("McpStatus.act")(function* (input: McpServerActionInput) {
    const runtime = yield* liveRuntime(input.threadId);
    const mcp: ProviderAdapter.ProviderAdapterV2McpServers | undefined = runtime?.mcpServers;
    if (mcp === undefined) {
      return yield* new McpStatusError({ reason: "Start a turn in this thread first." });
    }
    const providerFailed = failed(`The provider could not ${input.action} ${input.name}.`);
    switch (input.action) {
      case "reconnect":
        return yield* mcp.reconnect(input.name).pipe(Effect.mapError(providerFailed));
      case "enable":
      case "disable":
        return yield* mcp
          .setEnabled(input.name, input.action === "enable")
          .pipe(Effect.mapError(providerFailed));
      case "remove": {
        const servers = yield* mcp.status.pipe(Effect.mapError(providerFailed));
        const scope = servers.find((server) => server.name === input.name)?.scope;
        if (scope === undefined || !REMOVABLE_SCOPES.has(scope)) {
          return yield* new McpStatusError({
            reason: `${input.name} comes from a plugin or your Claude account; remove it there.`,
          });
        }
        return yield* mcp.remove(input.name, scope).pipe(Effect.mapError(providerFailed));
      }
    }
  });

  return McpStatus.of({ get, act });
});

export const layer = Layer.effect(McpStatus, make);
