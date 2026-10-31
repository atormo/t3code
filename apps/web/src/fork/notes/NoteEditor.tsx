import type { EnvironmentId } from "@t3tools/contracts";
import { Debouncer } from "@tanstack/react-pacer";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";

export type NoteSaveState = "saved" | "saving" | "failed";

/** One note as a rich Markdown editor; the file stays plain Markdown and saves while typing. */
export function NoteEditor(props: {
  environmentId: EnvironmentId;
  noteId: string;
  onSaveStateChange: (state: NoteSaveState) => void;
}) {
  const { environmentId, noteId, onSaveStateChange } = props;
  const readNotes = useAtomCommand(serverEnvironment.readNotes, { reportFailure: false });
  const writeNotes = useAtomCommand(serverEnvironment.writeNotes, { reportFailure: false });
  const [loaded, setLoaded] = useState<string | null>(null);
  const [saver] = useState(
    () =>
      new Debouncer(
        (content: string) => {
          void writeNotes({ environmentId, input: { id: noteId, content } }).then((result) =>
            onSaveStateChange(result._tag === "Success" ? "saved" : "failed"),
          );
        },
        { wait: 600 },
      ),
  );

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- loads the note file from the server once per mounted tab
  useEffect(() => {
    let cancelled = false;
    void readNotes({ environmentId, input: { id: noteId } }).then((result) => {
      if (cancelled) return;
      if (result._tag === "Success") setLoaded(result.value.content);
      else onSaveStateChange("failed");
    });
    return () => {
      cancelled = true;
      saver.flush();
    };
  }, [environmentId, noteId, readNotes, saver, onSaveStateChange]);

  const editor = useEditor(
    {
      extensions: [StarterKit, TaskList, TaskItem.configure({ nested: true }), Markdown],
      content: loaded ?? "",
      contentType: "markdown",
      autofocus: "end",
      editorProps: { attributes: { class: "fork-notes-editor", "aria-label": "Note" } },
      onUpdate: ({ editor: current }) => {
        onSaveStateChange("saving");
        saver.maybeExecute(current.getMarkdown());
      },
      onBlur: () => saver.flush(),
    },
    [loaded === null],
  );

  if (loaded === null) {
    return <p className="p-3 text-sm text-muted-foreground">Loading…</p>;
  }
  return <EditorContent editor={editor} className="min-h-0 flex-1 overflow-y-auto" />;
}
