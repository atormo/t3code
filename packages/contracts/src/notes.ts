import * as Schema from "effect/Schema";

/** The always-on scratchpad note, stored as one Markdown file in the environment's state dir. */
export const NotesReadResult = Schema.Struct({
  content: Schema.String,
});
export type NotesReadResult = typeof NotesReadResult.Type;

export const NotesWriteInput = Schema.Struct({
  content: Schema.String,
});
export type NotesWriteInput = typeof NotesWriteInput.Type;

export class NotesError extends Schema.TaggedError<NotesError>()("NotesError", {
  path: Schema.String,
  cause: Schema.optional(Schema.Defect()),
}) {
  override get message(): string {
    return `Unable to access the notes file at ${this.path}.`;
  }
}
