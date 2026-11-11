import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import * as ElectronDialog from "../electron/ElectronDialog.ts";

/** Written by scripts/fork/install-app.sh so the installed app knows which checkout built it. */
const SOURCE_FILE_NAME = ".t3code-fork.json";

const decodeSource = Schema.decodeUnknownEffect(
  Schema.fromJsonString(Schema.Struct({ repo: Schema.NonEmptyString })),
);

const readSourceRepo = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const home = yield* Config.String("HOME").pipe(Config.withDefault(""));
  const raw = yield* fileSystem.readFileString(path.join(home, SOURCE_FILE_NAME));
  return (yield* decodeSource(raw)).repo;
}).pipe(Effect.orElseSucceed(() => null));

const git = Effect.fn("ForkUpdates.git")(function* (repo: string, args: readonly string[]) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  return yield* spawner.string(ChildProcess.make("git", [...args], { cwd: repo }));
});

const commitsBehindUpstream = Effect.fn("ForkUpdates.commitsBehindUpstream")(function* (
  repo: string,
) {
  yield* git(repo, ["fetch", "--quiet", "upstream", "main"]);
  const count = yield* git(repo, ["rev-list", "--count", "HEAD..upstream/main"]);
  return Number(count.trim());
}, Effect.timeout("2 minutes"));

/** AppleScript that runs the fork's sync script in a new Terminal window. */
export function syncInTerminalScript(repo: string): string {
  const shellQuoted = `'${repo.replaceAll("'", `'\\''`)}'`;
  const command = `cd ${shellQuoted} && scripts/fork/sync-upstream.sh --install`;
  const appleScriptString = command.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `tell application "Terminal"\n  activate\n  do script "${appleScriptString}"\nend tell`;
}

/**
 * The fork has no update feed, so official releases never overwrite it. Instead this checks how
 * far the checkout is behind pingdotgg/t3code and offers to run the sync script, which merges,
 * runs the fork checks and reinstalls the app.
 */
export const checkForkUpdates = Effect.gen(function* () {
  const dialog = yield* ElectronDialog.ElectronDialog;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const repo = yield* readSourceRepo;
  if (repo === null) {
    yield* dialog.showMessageBox({
      type: "info",
      title: "Updates",
      message: "This build does not know where its source code is.",
      detail: "Reinstall it once with scripts/fork/install-app.sh from your t3code checkout.",
      buttons: ["OK"],
    });
    return;
  }
  const behind = yield* commitsBehindUpstream(repo).pipe(
    Effect.catch((error) =>
      dialog
        .showMessageBox({
          type: "warning",
          title: "Update check failed",
          message: "Could not check t3code for updates.",
          detail: String(error),
          buttons: ["OK"],
        })
        .pipe(Effect.as(null)),
    ),
  );
  if (behind === null) return;
  if (behind === 0) {
    yield* dialog.showMessageBox({
      type: "info",
      title: "You're up to date",
      message: "Your fork has every change from t3code.",
      buttons: ["OK"],
    });
    return;
  }
  const { response } = yield* dialog.showMessageBox({
    type: "info",
    title: "Updates available",
    message: `t3code has ${behind} new ${behind === 1 ? "change" : "changes"}.`,
    detail:
      "Update merges them into your fork, runs its checks and reinstalls T3 Code. It runs in Terminal; T3 Code quits and reopens at the end. If a change clashes with yours, it stops and lists the files.",
    buttons: ["Update", "Later"],
    defaultId: 0,
    cancelId: 1,
  });
  if (response !== 0) return;
  yield* spawner.string(ChildProcess.make("osascript", ["-e", syncInTerminalScript(repo)]));
}).pipe(
  Effect.ignore,
  Effect.provide(NodeServices.layer),
  Effect.withSpan("desktop.fork.checkForkUpdates"),
);
