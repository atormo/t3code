import type { NoteTab } from "@t3tools/contracts";
import { NotebookPenIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import { isElectron } from "../../env";
import { usePrimaryEnvironmentId } from "../../state/environments";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { NotesPanel } from "../notes/NotesPanel";
import { ClaudeUsageItem } from "./ClaudeUsageItem";
import { KeepAwakeItem } from "./KeepAwake";
import "./statusbar.css";

/** A bar along the bottom of the window: status on the left, Notes on the right. */
export function AppStatusBar() {
  const environmentId = usePrimaryEnvironmentId();
  const listNotes = useAtomCommand(serverEnvironment.listNotes, { reportFailure: false });
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteTabs, setNoteTabs] = useState<readonly NoteTab[] | null>(null);

  const openNotes = () => {
    setNotesOpen(true);
    if (environmentId === null || noteTabs !== null) return;
    void listNotes({ environmentId, input: {} }).then((result) => {
      if (result._tag === "Success") setNoteTabs(result.value.tabs);
    });
  };

  return (
    <footer
      aria-label="Status bar"
      className="fixed inset-x-0 bottom-0 z-30 flex h-(--fork-statusbar-height) items-center gap-1 border-t bg-sidebar px-2 text-sidebar-foreground"
    >
      {environmentId !== null ? <ClaudeUsageItem /> : null}
      {isElectron ? <KeepAwakeItem /> : null}
      <div className="flex-1" />
      <Button
        size="micro"
        variant={notesOpen ? "secondary" : "ghost-muted"}
        aria-expanded={notesOpen}
        disabled={environmentId === null}
        onClick={notesOpen ? () => setNotesOpen(false) : openNotes}
      >
        <NotebookPenIcon aria-hidden />
        <span>Notes</span>
      </Button>
      {notesOpen && environmentId !== null && noteTabs !== null ? (
        <div className="absolute right-2 bottom-[calc(100%+0.5rem)]">
          <NotesPanel
            environmentId={environmentId}
            tabs={noteTabs}
            onTabsChange={setNoteTabs}
            onClose={() => setNotesOpen(false)}
          />
        </div>
      ) : null}
    </footer>
  );
}
