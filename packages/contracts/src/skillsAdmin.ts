import * as Schema from "effect/Schema";

/** Fork: moves one of your skills to the Trash. `path` is the skill's path as the provider reports it. */
export const SkillRemoveInput = Schema.Struct({ path: Schema.String });
export type SkillRemoveInput = typeof SkillRemoveInput.Type;

export class SkillRemoveError extends Schema.TaggedError<SkillRemoveError>()("SkillRemoveError", {
  reason: Schema.String,
}) {
  override get message(): string {
    return this.reason;
  }
}
