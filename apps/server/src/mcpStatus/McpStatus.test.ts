import {
  ProviderSessionId,
  ProviderThreadId,
  ThreadId,
  type OrchestrationV2ProviderThread,
  type ProviderMcpServer,
} from "@t3tools/contracts";
import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";

import * as Orchestrator from "../orchestration-v2/Orchestrator.ts";
import type * as ProviderAdapter from "@t3tools/provider-core/server/ProviderAdapter";
import * as ProviderSessionManager from "../orchestration-v2/ProviderSessionManager.ts";
import * as McpStatus from "./McpStatus.ts";

const threadId = ThreadId.make("thread-mcp");
const providerThreadId = ProviderThreadId.make("provider-thread-mcp");
const providerSessionId = ProviderSessionId.make("provider-session-mcp");

const servers: ProviderMcpServer[] = [
  { name: "figma", status: "connected", scope: "user", toolCount: 14 },
  { name: "notion", status: "needs-auth", scope: "plugin", toolCount: 0 },
];

function makeLayer(input: {
  readonly session: "none" | "unsupported" | "live";
  readonly removed?: Array<{ name: string; scope: string }>;
}) {
  const mcpServers: ProviderAdapter.ProviderAdapterV2McpServers = {
    status: Effect.succeed(servers),
    reconnect: () => Effect.void,
    setEnabled: () => Effect.void,
    remove: (name, scope) => Effect.sync(() => void input.removed?.push({ name, scope })),
  };
  return McpStatus.layer.pipe(
    Layer.provide(
      Layer.mergeAll(
        Layer.mock(Orchestrator.OrchestratorV2)({
          getThreadRecords: () =>
            Effect.succeed({
              thread: { activeProviderThreadId: providerThreadId },
              providerThreads: [
                { id: providerThreadId, providerSessionId } as OrchestrationV2ProviderThread,
              ],
            } as never),
        }),
        Layer.mock(ProviderSessionManager.ProviderSessionManagerV2)({
          get: () =>
            Effect.succeed(
              input.session === "none"
                ? Option.none()
                : Option.some({
                    driver: "claudeAgent",
                    ...(input.session === "live" ? { mcpServers } : {}),
                  } as unknown as ProviderAdapter.ProviderAdapterV2SessionRuntime),
            ),
        }),
      ),
    ),
  );
}

describe("McpStatus", () => {
  it.effect("reports no session, an unsupported provider, and live servers", () =>
    Effect.gen(function* () {
      const read = McpStatus.McpStatus.use((status) => status.get(threadId));
      assert.strictEqual(
        (yield* read.pipe(Effect.provide(makeLayer({ session: "none" })))).state,
        "no-session",
      );
      assert.strictEqual(
        (yield* read.pipe(Effect.provide(makeLayer({ session: "unsupported" })))).state,
        "unsupported",
      );
      const live = yield* read.pipe(Effect.provide(makeLayer({ session: "live" })));
      assert.strictEqual(live.state, "live");
      assert.deepStrictEqual(
        live.servers.map((server) => server.name),
        ["figma", "notion"],
      );
    }),
  );

  it.effect("removes only servers from a config scope it can edit", () =>
    Effect.gen(function* () {
      const removed: Array<{ name: string; scope: string }> = [];
      const remove = (name: string) =>
        McpStatus.McpStatus.use((status) => status.act({ threadId, name, action: "remove" })).pipe(
          Effect.provide(makeLayer({ session: "live", removed })),
        );
      yield* remove("figma");
      const refused = yield* remove("notion").pipe(Effect.flip);
      assert.deepStrictEqual(removed, [{ name: "figma", scope: "user" }]);
      assert.include(refused.reason, "plugin");
    }),
  );
});
