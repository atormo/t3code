import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";

import { NotesError, type NotesReadResult, type NotesWriteInput } from "@t3tools/contracts";
import { writeFileStringAtomically } from "@t3tools/shared/atomicWrite";

import * as ServerConfig from "../config.ts";

export class Notes extends Context.Service<
  Notes,
  {
    /** A missing file reads as an empty note. */
    readonly read: Effect.Effect<NotesReadResult, NotesError>;
    readonly write: (input: NotesWriteInput) => Effect.Effect<void, NotesError>;
  }
>()("t3/notes/Notes") {}

/** @public */
export const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stateDir } = yield* ServerConfig.ServerConfig;
  const notePath = path.join(stateDir, "notes", "scratchpad.md");

  const read: Notes["Service"]["read"] = fs.readFileString(notePath).pipe(
    Effect.map((content) => ({ content })),
    Effect.catchTags({
      PlatformError: (cause) =>
        cause.reason._tag === "NotFound"
          ? Effect.succeed({ content: "" })
          : Effect.fail(new NotesError({ path: notePath, cause })),
    }),
    Effect.withSpan("Notes.read"),
  );

  const write: Notes["Service"]["write"] = Effect.fn("Notes.write")(function* (input) {
    yield* writeFileStringAtomically({ filePath: notePath, contents: input.content }).pipe(
      Effect.provideService(FileSystem.FileSystem, fs),
      Effect.provideService(Path.Path, path),
      Effect.mapError((cause) => new NotesError({ path: notePath, cause })),
    );
  });

  return Notes.of({ read, write });
});

export const layer = Layer.effect(Notes, make);
