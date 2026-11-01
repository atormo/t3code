import { SkillRemoveError } from "@t3tools/contracts";
import * as Clock from "effect/Clock";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";

import { removableSkillDirectory } from "./skillRemoval.ts";

/** Fork: removes a skill by moving its folder to the Trash, so a mistake can be undone. */
export class SkillsAdmin extends Context.Service<
  SkillsAdmin,
  { readonly remove: (skillPath: string) => Effect.Effect<void, SkillRemoveError> }
>()("t3/skills/SkillsAdmin") {}

const make = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const remove = Effect.fn("SkillsAdmin.remove")(function* (skillPath: string) {
    const directory = removableSkillDirectory(skillPath);
    if (directory === null) {
      return yield* new SkillRemoveError({
        reason: "Only your own and project skills can be removed here.",
      });
    }
    const trash = path.join(process.env.HOME ?? "", ".Trash");
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

  return SkillsAdmin.of({ remove });
});

export const layer = Layer.effect(SkillsAdmin, make);
