import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import {
  NotesError,
  NotesListResult,
  type NotesReadInput,
  type NotesReadResult,
  type NotesSetTabsInput,
  type NotesWriteInput,
} from "@t3tools/contracts";
import { writeFileStringAtomically } from "@t3tools/shared/atomicWrite";

import * as ServerConfig from "../config.ts";

/** The first single-note release wrote this file, so it opens as the first tab. */
const DEFAULT_TABS: NotesListResult = { tabs: [{ id: "scratchpad", title: "Notes" }] };

const IndexJson = Schema.fromJsonString(NotesListResult);
const decodeIndex = Schema.decodeEffect(IndexJson);
const encodeIndex = Schema.encodeEffect(IndexJson);

export class Notes extends Context.Service<
  Notes,
  {
    /** With no index yet, lists the one default tab. */
    readonly list: Effect.Effect<NotesListResult, NotesError>;
    /** A missing file reads as an empty note. */
    readonly read: (input: NotesReadInput) => Effect.Effect<NotesReadResult, NotesError>;
    readonly write: (input: NotesWriteInput) => Effect.Effect<void, NotesError>;
    /** Saves tab order and titles, and removes the files of tabs that were closed. */
    readonly setTabs: (input: NotesSetTabsInput) => Effect.Effect<void, NotesError>;
  }
>()("t3/notes/Notes") {}

/** @public */
export const make = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const { stateDir } = yield* ServerConfig.ServerConfig;
  const notesDir = path.join(stateDir, "notes");
  const indexPath = path.join(notesDir, "index.json");
  const notePath = (id: string) => path.join(notesDir, `${id}.md`);

  const writeFile = (filePath: string, contents: string) =>
    writeFileStringAtomically({ filePath, contents }).pipe(
      Effect.provideService(FileSystem.FileSystem, fs),
      Effect.provideService(Path.Path, path),
      Effect.mapError((cause) => new NotesError({ path: filePath, cause })),
    );

  const readOrEmpty = (filePath: string) =>
    fs.readFileString(filePath).pipe(
      Effect.catchTags({
        PlatformError: (cause) =>
          cause.reason._tag === "NotFound"
            ? Effect.succeed("")
            : Effect.fail(new NotesError({ path: filePath, cause })),
      }),
    );

  const list: Notes["Service"]["list"] = readOrEmpty(indexPath).pipe(
    Effect.flatMap((raw) =>
      raw === ""
        ? Effect.succeed(DEFAULT_TABS)
        : decodeIndex(raw).pipe(
            Effect.mapError((cause) => new NotesError({ path: indexPath, cause })),
          ),
    ),
    Effect.withSpan("Notes.list"),
  );

  const read: Notes["Service"]["read"] = Effect.fn("Notes.read")(function* (input) {
    return { content: yield* readOrEmpty(notePath(input.id)) };
  });

  const write: Notes["Service"]["write"] = Effect.fn("Notes.write")(function* (input) {
    yield* writeFile(notePath(input.id), input.content);
  });

  const setTabs: Notes["Service"]["setTabs"] = Effect.fn("Notes.setTabs")(function* (input) {
    const previous = yield* list;
    const kept = new Set(input.tabs.map((tab) => tab.id));
    const encoded = yield* encodeIndex({ tabs: input.tabs }).pipe(
      Effect.mapError((cause) => new NotesError({ path: indexPath, cause })),
    );
    yield* writeFile(indexPath, `${encoded}\n`);
    for (const tab of previous.tabs) {
      if (kept.has(tab.id)) continue;
      yield* fs
        .remove(notePath(tab.id), { force: true })
        .pipe(Effect.mapError((cause) => new NotesError({ path: notePath(tab.id), cause })));
    }
  });

  return Notes.of({ list, read, write, setTabs });
});

export const layer = Layer.effect(Notes, make);
