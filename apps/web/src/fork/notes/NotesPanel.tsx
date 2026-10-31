import type { EnvironmentId, NoteTab } from "@t3tools/contracts";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import { readLocalApi } from "../../localApi";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { NoteEditor, type NoteSaveState } from "./NoteEditor";
import "./notes.css";

function newNoteId(): string {
  return `note-${Date.now().toString(36)}`;
}

/** Notes with tabs. Each tab is one Markdown file in the environment's notes dir. */
export function NotesPanel(props: {
  environmentId: EnvironmentId;
  tabs: readonly NoteTab[];
  onTabsChange: (tabs: readonly NoteTab[]) => void;
  onClose: () => void;
}) {
  const { environmentId, tabs, onTabsChange } = props;
  const setNoteTabs = useAtomCommand(serverEnvironment.setNoteTabs, { reportFailure: false });
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<NoteSaveState>("saved");
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0] ?? null;

  const commitTabs = (next: readonly NoteTab[]) => {
    onTabsChange(next);
    void setNoteTabs({ environmentId, input: { tabs: [...next] } });
  };

  const addTab = () => {
    const tab = { id: newNoteId(), title: `Note ${tabs.length + 1}` };
    commitTabs([...tabs, tab]);
    setActiveId(tab.id);
  };

  const closeTab = async (tab: NoteTab) => {
    if (tabs.length === 1) return;
    const confirmed =
      (await readLocalApi()?.dialogs.confirm(`Delete the note "${tab.title}"?`, {
        variant: "destructive",
      })) ?? false;
    if (!confirmed) return;
    const next = tabs.filter((candidate) => candidate.id !== tab.id);
    commitTabs(next);
    if (active?.id === tab.id) setActiveId(next[0]?.id ?? null);
  };

  const renameTab = (tab: NoteTab, title: string) => {
    setRenamingId(null);
    const trimmed = title.trim().slice(0, 120);
    if (trimmed.length === 0 || trimmed === tab.title) return;
    commitTabs(
      tabs.map((candidate) => (candidate.id === tab.id ? { ...tab, title: trimmed } : candidate)),
    );
  };

  return (
    <section
      aria-label="Notes"
      className="flex h-[min(32rem,70dvh)] w-[min(30rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
      onKeyDown={(event) => {
        if (event.key === "Escape" && renamingId === null) props.onClose();
      }}
    >
      <header className="flex h-9 shrink-0 items-center gap-1 border-b px-1.5">
        <div role="tablist" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab) => {
            const selected = tab.id === active?.id;
            return renamingId === tab.id ? (
              <input
                key={tab.id}
                aria-label="Note name"
                autoFocus
                defaultValue={tab.title}
                onBlur={(event) => renameTab(tab, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") renameTab(tab, event.currentTarget.value);
                  if (event.key === "Escape") setRenamingId(null);
                }}
                className="h-6 w-28 shrink-0 rounded-md border bg-background px-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              />
            ) : (
              <div
                key={tab.id}
                className="group/note-tab flex h-6 shrink-0 items-center rounded-md data-[selected=true]:bg-accent"
                data-selected={selected}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(tab.id)}
                  onDoubleClick={() => setRenamingId(tab.id)}
                  className="max-w-36 truncate px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {tab.title}
                </button>
                {tabs.length > 1 ? (
                  <button
                    type="button"
                    aria-label={`Delete ${tab.title}`}
                    onClick={() => void closeTab(tab)}
                    className="mr-1 hidden rounded-sm text-muted-foreground group-hover/note-tab:block hover:text-foreground"
                  >
                    <XIcon aria-hidden className="size-3" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground" aria-live="polite">
          {saveState === "saving" ? "Saving…" : saveState === "failed" ? "Not saved" : null}
        </span>
        <Button size="icon-xs" variant="ghost-muted" aria-label="New note" onClick={addTab}>
          <PlusIcon aria-hidden />
        </Button>
        <Button
          size="icon-xs"
          variant="ghost-muted"
          aria-label="Close notes"
          onClick={props.onClose}
        >
          <XIcon aria-hidden />
        </Button>
      </header>
      {active ? (
        <NoteEditor
          key={active.id}
          environmentId={environmentId}
          noteId={active.id}
          onSaveStateChange={setSaveState}
        />
      ) : null}
    </section>
  );
}
