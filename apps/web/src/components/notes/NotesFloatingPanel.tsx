import { Debouncer } from "@tanstack/react-pacer";
import { NotebookPenIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { usePrimaryEnvironmentId } from "../../state/environments";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { Button } from "../ui/button";

type SaveState = "saved" | "saving" | "failed";

/**
 * An always-there scratchpad in the bottom-right corner. The note is one Markdown file in the
 * primary environment's state dir, saved while you type.
 */
export function NotesFloatingPanel() {
  const environmentId = usePrimaryEnvironmentId();
  const readNotes = useAtomCommand(serverEnvironment.readNotes, { reportFailure: false });
  const writeNotes = useAtomCommand(serverEnvironment.writeNotes, { reportFailure: false });
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saver] = useState(
    () =>
      new Debouncer(
        (next: { environmentId: NonNullable<typeof environmentId>; content: string }) => {
          void writeNotes({
            environmentId: next.environmentId,
            input: { content: next.content },
          }).then((result) => setSaveState(result._tag === "Success" ? "saved" : "failed"));
        },
        { wait: 600 },
      ),
  );
  const loadedForRef = useRef<string | null>(null);

  if (environmentId === null) return null;

  const openPanel = () => {
    setOpen(true);
    if (loadedForRef.current === environmentId) return;
    loadedForRef.current = environmentId;
    void readNotes({ environmentId, input: {} }).then((result) => {
      if (result._tag === "Success") {
        setContent(result.value.content);
      } else {
        loadedForRef.current = null;
        setSaveState("failed");
      }
    });
  };

  const closePanel = () => {
    saver.flush();
    setOpen(false);
  };

  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-40 flex flex-col items-end gap-2">
      {open ? (
        <section
          aria-label="Notes"
          className="pointer-events-auto flex h-[min(28rem,70dvh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "Escape") closePanel();
          }}
        >
          <header className="flex h-9 shrink-0 items-center gap-2 border-b px-3">
            <NotebookPenIcon aria-hidden className="size-3.5 text-muted-foreground" />
            <h2 className="flex-1 text-sm font-medium">Notes</h2>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {saveState === "saving" ? "Saving…" : saveState === "failed" ? "Not saved" : null}
            </span>
            <Button
              size="icon-xs"
              variant="ghost-muted"
              aria-label="Close notes"
              onClick={closePanel}
            >
              <XIcon aria-hidden />
            </Button>
          </header>
          <textarea
            aria-label="Notes"
            autoFocus
            readOnly={content === null}
            spellCheck
            placeholder={content === null ? "Loading…" : "Write anything. It stays here."}
            value={content ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              setContent(next);
              setSaveState("saving");
              saver.maybeExecute({ environmentId, content: next });
            }}
            onBlur={() => saver.flush()}
            className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
          />
        </section>
      ) : null}
      <Button
        className="pointer-events-auto"
        size="icon"
        variant="glass"
        aria-label={open ? "Close notes" : "Open notes"}
        aria-expanded={open}
        onClick={open ? closePanel : openPanel}
      >
        <NotebookPenIcon aria-hidden />
      </Button>
    </div>
  );
}
