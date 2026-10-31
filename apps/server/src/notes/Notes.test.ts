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
  it.effect("starts with one empty tab, then reads what was written", () =>
    Effect.gen(function* () {
      const notes = yield* Notes.Notes;
      assert.deepEqual(yield* notes.list, { tabs: [{ id: "scratchpad", title: "Notes" }] });
      assert.deepEqual(yield* notes.read({ id: "scratchpad" }), { content: "" });

      yield* notes.write({ id: "scratchpad", content: "# Ideas\n\n- ship folders\n" });

      assert.deepEqual(yield* notes.read({ id: "scratchpad" }), {
        content: "# Ideas\n\n- ship folders\n",
      });
    }).pipe(Effect.provide(layerNotes())),
  );

  it.effect("removes the file of a closed tab and keeps the rest", () =>
    Effect.gen(function* () {
      const notes = yield* Notes.Notes;
      const tabs = [
        { id: "scratchpad", title: "Notes" },
        { id: "todo", title: "To do" },
      ];
      yield* notes.setTabs({ tabs });
      yield* notes.write({ id: "scratchpad", content: "keep" });
      yield* notes.write({ id: "todo", content: "drop" });

      yield* notes.setTabs({ tabs: [tabs[1]!] });

      assert.deepEqual(yield* notes.list, { tabs: [tabs[1]!] });
      assert.deepEqual(yield* notes.read({ id: "scratchpad" }), { content: "" });
      assert.deepEqual(yield* notes.read({ id: "todo" }), { content: "drop" });
    }).pipe(Effect.provide(layerNotes())),
  );
});
