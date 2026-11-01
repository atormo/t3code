import * as Schema from "effect/Schema";

/** Fork: moves one of your skills to the Trash. `path` is the skill's path as the provider reports it. */
export const SkillRemoveInput = Schema.Struct({ path: Schema.String });
export type SkillRemoveInput = typeof SkillRemoveInput.Type;

export const SkillInspectInput = Schema.Struct({ path: Schema.String });
export type SkillInspectInput = typeof SkillInspectInput.Type;

export const SkillInspectResult = Schema.Struct({
  /** Absolute path of the skill's SKILL.md. */
  file: Schema.String,
  /** The start of SKILL.md, enough for a preview. */
  head: Schema.String,
  /** The skill's folder on GitHub when it lives in a clone of a GitHub repository. */
  githubUrl: Schema.NullOr(Schema.String),
});
export type SkillInspectResult = typeof SkillInspectResult.Type;

export class SkillRemoveError extends Schema.TaggedError<SkillRemoveError>()("SkillRemoveError", {
  reason: Schema.String,
}) {
  override get message(): string {
    return this.reason;
  }
}
