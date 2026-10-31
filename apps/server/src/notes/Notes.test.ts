import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import * as ServerConfig from "../config.ts";
import * as Notes from "./Notes.ts";

const layerNotes = () =>
  Notes.layer.pipe(
    Layer.provideMerge(
      Layer.fresh(ServerConfig.layerTest(process.cwd(), { prefix: "t3code-notes-test-" })),
    ),
  );

it.layer(NodeServices.layer)("notes", (it) => {
  it.effect("reads an empty note before the first write, then what was written", () =>
    Effect.gen(function* () {
      const notes = yield* Notes.Notes;
      assert.deepEqual(yield* notes.read, { content: "" });

      yield* notes.write({ content: "# Ideas\n\n- ship folders\n" });

      assert.deepEqual(yield* notes.read, { content: "# Ideas\n\n- ship folders\n" });
    }).pipe(Effect.provide(layerNotes())),
  );
});
