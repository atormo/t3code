import {
  SkillRemoveError,
  type SkillAuthorsResult,
  type SkillInspectResult,
} from "@t3tools/contracts";
import * as Clock from "effect/Clock";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import {
  authorFromFrontMatter,
  authorFromLicense,
  authorFromPluginManifest,
  authorFromSkillLock,
  type SkillAuthor,
} from "./skillAuthors.ts";
import { githubTreeUrl, removableSkillDirectory, skillFileOf } from "./skillRemoval.ts";

/** Fork: removes a skill by moving its folder to the Trash, so a mistake can be undone. */
export class SkillsAdmin extends Context.Service<
  SkillsAdmin,
  {
    readonly remove: (skillPath: string) => Effect.Effect<void, SkillRemoveError>;
    readonly inspect: (skillPath: string) => Effect.Effect<SkillInspectResult, SkillRemoveError>;
    readonly authors: (paths: readonly string[]) => Effect.Effect<SkillAuthorsResult>;
  }
>()("t3/skills/SkillsAdmin") {}

const make = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const home = yield* Config.String("HOME").pipe(Config.withDefault(""));

  const git = (cwd: string, args: readonly string[]) =>
    spawner
      .string(ChildProcess.make("git", [...args], { cwd }))
      .pipe(Effect.map((out) => out.trim()));

  const readText = (file: string) =>
    fileSystem.readFileString(file).pipe(Effect.orElseSucceed(() => null));
  const readJson = (file: string) =>
    readText(file).pipe(
      Effect.map((text) => {
        if (text === null) return null;
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return null;
        }
      }),
    );
  const skillLock = readJson(path.join(home, ".agents", ".skill-lock.json"));

  /** Install record first, then the skill's own front matter, LICENSE, and its plugin's manifest. */
  const authorOf = Effect.fn("SkillsAdmin.authorOf")(function* (directory: string, lock: unknown) {
    const fromLock = authorFromSkillLock(lock, path.basename(directory));
    if (fromLock) return fromLock;
    const skillMd = yield* readText(path.join(directory, "SKILL.md"));
    const fromFrontMatter = skillMd === null ? null : authorFromFrontMatter(skillMd);
    if (fromFrontMatter) return { author: fromFrontMatter, githubUrl: null } satisfies SkillAuthor;
    for (const name of ["LICENSE", "LICENSE.txt", "LICENSE.md"]) {
      const license = yield* readText(path.join(directory, name));
      const holder = license === null ? null : authorFromLicense(license);
      if (holder) return { author: holder, githubUrl: null } satisfies SkillAuthor;
    }
    let current = directory;
    for (let depth = 0; depth < 5; depth++) {
      const manifest = yield* readJson(path.join(current, ".claude-plugin", "plugin.json"));
      const pluginAuthor = authorFromPluginManifest(manifest);
      if (pluginAuthor) return { author: pluginAuthor, githubUrl: null } satisfies SkillAuthor;
      current = path.dirname(current);
    }
    return { author: null, githubUrl: null } satisfies SkillAuthor;
  });

  const authors = Effect.fn("SkillsAdmin.authors")(function* (paths: readonly string[]) {
    const lock = yield* skillLock;
    const results = yield* Effect.forEach(
      paths,
      (skillPath) => {
        const file = skillFileOf(skillPath);
        return file === null
          ? Effect.succeed({ path: skillPath, author: null, githubUrl: null })
          : authorOf(path.dirname(file), lock).pipe(
              Effect.map((found) => ({ path: skillPath, ...found })),
            );
      },
      { concurrency: 8 },
    );
    return { authors: results } satisfies SkillAuthorsResult;
  });

  const inspect = Effect.fn("SkillsAdmin.inspect")(function* (skillPath: string) {
    const file = skillFileOf(skillPath);
    if (file === null) return yield* new SkillRemoveError({ reason: "That is not a skill." });
    const text = yield* fileSystem
      .readFileString(file)
      .pipe(Effect.mapError(() => new SkillRemoveError({ reason: "Could not read SKILL.md." })));
    const directory = path.dirname(file);
    const githubUrl = yield* Effect.all([
      git(directory, ["rev-parse", "--show-toplevel"]),
      git(directory, ["remote", "get-url", "origin"]),
    ]).pipe(
      Effect.map(([root, remote]) => githubTreeUrl(remote, root, directory)),
      Effect.orElseSucceed(() => null),
    );
    const found = yield* authorOf(directory, yield* skillLock);
    return {
      file,
      head: text.slice(0, 4000),
      githubUrl: found.githubUrl ?? githubUrl,
      author: found.author,
    } satisfies SkillInspectResult;
  });

  const remove = Effect.fn("SkillsAdmin.remove")(function* (skillPath: string) {
    const directory = removableSkillDirectory(skillPath);
    if (directory === null) {
      return yield* new SkillRemoveError({
        reason: "Only your own and project skills can be removed here.",
      });
    }
    const trash = path.join(home, ".Trash");
    const name = path.basename(directory);
    const target = (yield* fileSystem
      .exists(path.join(trash, name))
      .pipe(Effect.orElseSucceed(() => false)))
      ? path.join(trash, `${name} ${yield* Clock.currentTimeMillis}`)
      : path.join(trash, name);
    yield* fileSystem
      .rename(directory, target)
      .pipe(
        Effect.mapError(
          () => new SkillRemoveError({ reason: `Could not move ${name} to the Trash.` }),
        ),
      );
  });

  return SkillsAdmin.of({ remove, inspect, authors });
});

export const layer = Layer.effect(SkillsAdmin, make);
