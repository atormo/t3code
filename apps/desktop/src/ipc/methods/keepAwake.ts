import * as Electron from "electron";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import * as DesktopIpc from "../DesktopIpc.ts";
import { SET_KEEP_AWAKE_CHANNEL } from "../channels.ts";

/** Keeps the Mac out of sleep while the renderer reports agents at work. */
export const installKeepAwake = Effect.fn("desktop.ipc.installKeepAwake")(function* () {
  const ipc = yield* DesktopIpc.DesktopIpc;
  let blockerId: number | null = null;
  const setActive = (active: boolean) => {
    if (active && blockerId === null) {
      blockerId = Electron.powerSaveBlocker.start("prevent-app-suspension");
    } else if (!active && blockerId !== null) {
      Electron.powerSaveBlocker.stop(blockerId);
      blockerId = null;
    }
  };
  yield* ipc.handle(
    DesktopIpc.makeIpcMethod({
      channel: SET_KEEP_AWAKE_CHANNEL,
      payload: Schema.Boolean,
      result: Schema.Void,
      handler: (active) => Effect.sync(() => setActive(active)),
    }),
  );
  yield* Effect.addFinalizer(() => Effect.sync(() => setActive(false)));
});
