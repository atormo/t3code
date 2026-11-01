import * as Electron from "electron";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import * as DesktopEnvironment from "../../app/DesktopEnvironment.ts";
import * as DesktopIpc from "../DesktopIpc.ts";
import { SET_APP_ICON_CHANNEL } from "../channels.ts";

const AppIcon = Schema.Literals(["black", "blueprint", "nightly"]);

/** The .app bundle holding this executable, or null outside a packaged Mac build. */
export function appBundlePath(execPath: string): string | null {
  const match = /^(.*?\.app)\/Contents\/MacOS\//.exec(execPath);
  return match?.[1] ?? null;
}

/** JXA that sets (or, with no image, clears) the bundle's custom icon, as Finder's Get Info does. */
export function setBundleIconScript(bundlePath: string, imagePath: string | null): string {
  const image =
    imagePath === null
      ? "$()"
      : `$.NSImage.alloc.initWithContentsOfFile(${JSON.stringify(imagePath)})`;
  return `ObjC.import("AppKit"); $.NSWorkspace.sharedWorkspace.setIconForFileOptions(${image}, ${JSON.stringify(bundlePath)}, 0);`;
}

/**
 * Fork: switches the Dock icon right away and, in a packaged app, sets the bundle's own icon so
 * Finder and a closed Dock show it too. The default icon clears the custom one.
 */
export const installAppIcon = Effect.fn("desktop.ipc.installAppIcon")(function* () {
  const ipc = yield* DesktopIpc.DesktopIpc;
  const environment = yield* DesktopEnvironment.DesktopEnvironment;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  yield* ipc.handle(
    DesktopIpc.makeIpcMethod({
      channel: SET_APP_ICON_CHANNEL,
      payload: AppIcon,
      result: Schema.Void,
      handler: Effect.fn("desktop.ipc.setAppIcon")(function* (icon) {
        if (environment.platform !== "darwin") return;
        const imagePath = environment
          .resolveResourcePathCandidates(`fork-icons/${icon}.png`)
          .find((candidate) => !Electron.nativeImage.createFromPath(candidate).isEmpty());
        if (imagePath === undefined) return;
        const image = Electron.nativeImage.createFromPath(imagePath);
        Electron.app.dock?.setIcon(image);
        const bundle = environment.isPackaged ? appBundlePath(process.execPath) : null;
        if (bundle === null) return;
        // The packaged icons live inside app.asar, which only Electron can read; hand macOS a real file.
        const realImagePath = path.join(
          Electron.app.getPath("temp"),
          `t3code-app-icon-${icon}.png`,
        );
        yield* fileSystem.writeFile(realImagePath, image.toPNG()).pipe(Effect.ignore);
        yield* spawner
          .string(
            ChildProcess.make("osascript", [
              "-l",
              "JavaScript",
              "-e",
              setBundleIconScript(bundle, icon === "black" ? null : realImagePath),
            ]),
          )
          .pipe(Effect.ignore);
      }),
    }),
  );
});
