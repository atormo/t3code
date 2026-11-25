// fork: telemetry is opt-in. These fail if an upstream merge turns it back on by default.
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as HttpServer from "effect/http/HttpServer";
import * as HttpServerRequest from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import * as HostProcess from "@t3tools/shared/HostProcess";

import * as ServerSecretStore from "../auth/ServerSecretStore.ts";
import * as ServerConfig from "../config.ts";
import * as ManagedPolicy from "../policy/ManagedPolicy.ts";
import * as AnalyticsService from "./AnalyticsService.ts";
import * as Identify from "./Identify.ts";

const writeClaudeJson = Effect.fn("test.writeClaudeJson")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const home = yield* fs.makeTempDirectoryScoped({ prefix: "t3-fork-telemetry-home-" });
  yield* fs.writeFileString(
    path.join(home, ".claude.json"),
    JSON.stringify({ userID: "machine-1", oauthAccount: { accountUuid: "account-1" } }),
  );
  return home;
});

it.layer(Layer.mergeAll(NodeServices.layer, NodeCrypto.layer))("fork telemetry opt-in", (it) => {
  it.effect("sends nothing when T3CODE_TELEMETRY_ENABLED is unset", () =>
    Effect.gen(function* () {
      const home = yield* writeClaudeJson();
      const capturedPaths: Array<string> = [];
      const layerServerConfig = ServerConfig.ServerConfig.layerTest(process.cwd(), {
        prefix: "t3-fork-telemetry-off-",
      });
      const layerRuntime = AnalyticsService.layer.pipe(
        Layer.provideMerge(layerServerConfig),
        Layer.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              T3CODE_POSTHOG_KEY: "phc_test_key",
              T3CODE_POSTHOG_HOST: "http://localhost",
            }),
          ),
        ),
        Layer.provide(
          Layer.mergeAll(
            Layer.succeed(HostProcess.Platform, "darwin"),
            Layer.succeed(HostProcess.Architecture, "arm64"),
            ManagedPolicy.layerTest(),
          ),
        ),
        Layer.provideMerge(NodeHttpServer.layerTest),
      );

      const recorded = yield* Effect.gen(function* () {
        yield* Layer.launch(
          HttpServer.serve(
            Effect.gen(function* () {
              capturedPaths.push((yield* HttpServerRequest.HttpServerRequest).url);
              return HttpServerResponse.jsonUnsafe({});
            }),
          ),
        ).pipe(Effect.forkScoped);
        const analytics = yield* AnalyticsService.AnalyticsService;
        const ok = yield* analytics.record("fork.test", { index: 1 });
        yield* analytics.flush;
        return ok;
      }).pipe(
        Effect.provide(layerRuntime),
        Effect.provideService(HostProcess.HomeDirectory, home),
        Effect.provideService(HostProcess.Environment, {}),
      );

      assert.isFalse(recorded);
      assert.deepEqual(capturedPaths, []);
    }),
  );

  it.effect("does not read provider logins unless telemetry is opted into", () =>
    Effect.gen(function* () {
      const home = yield* writeClaudeJson();
      const layerIdentity = Layer.provideMerge(
        ServerSecretStore.layer,
        ServerConfig.layerTest(process.cwd(), { prefix: "t3-fork-telemetry-owners-" }),
      );
      const owners = (env: NodeJS.ProcessEnv) =>
        Identify.getServerOwners.pipe(
          Effect.provideService(HostProcess.HomeDirectory, home),
          Effect.provideService(HostProcess.Environment, env),
          Effect.provide(layerIdentity),
        );

      assert.deepEqual(yield* owners({}), []);
      assert.deepEqual(yield* owners({ T3CODE_TELEMETRY_ENABLED: "false" }), []);
      const optedIn = yield* owners({ T3CODE_TELEMETRY_ENABLED: "true" });
      assert.deepEqual(
        optedIn.map((owner) => owner.source),
        ["claude"],
      );
    }),
  );
});
