import * as Schema from "effect/Schema";

/** A note's file stem inside the notes dir; the pattern keeps it from naming another path. */
export const NoteId = Schema.String.check(Schema.isPattern(/^[a-z0-9][a-z0-9-]{0,63}$/));
export type NoteId = typeof NoteId.Type;

export const NoteTab = Schema.Struct({
  id: NoteId,
  title: Schema.String.check(Schema.isMaxLength(120)),
});
export type NoteTab = typeof NoteTab.Type;

export const NotesListResult = Schema.Struct({
  tabs: Schema.Array(NoteTab),
});
export type NotesListResult = typeof NotesListResult.Type;

export const NotesReadInput = Schema.Struct({ id: NoteId });
export type NotesReadInput = typeof NotesReadInput.Type;

export const NotesReadResult = Schema.Struct({
  content: Schema.String,
});
export type NotesReadResult = typeof NotesReadResult.Type;

export const NotesWriteInput = Schema.Struct({
  id: NoteId,
  content: Schema.String,
});
export type NotesWriteInput = typeof NotesWriteInput.Type;

/** Replaces the tab list. A tab left out is closed and its file removed. */
export const NotesSetTabsInput = Schema.Struct({
  tabs: Schema.Array(NoteTab).check(Schema.isMinLength(1)),
});
export type NotesSetTabsInput = typeof NotesSetTabsInput.Type;

export class NotesError extends Schema.TaggedError<NotesError>()("NotesError", {
  path: Schema.String,
  cause: Schema.optional(Schema.Defect()),
}) {
  override get message(): string {
    return `Unable to access the notes file at ${this.path}.`;
  }
}
