import type {
  EnvironmentId,
  ScopedThreadRef,
  ServerProviderSkill,
  SkillInspectResult,
} from "@t3tools/contracts";
import { ExternalLinkIcon, EyeIcon, FileTextIcon, FolderIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover";
import { readLocalApi } from "../../localApi";
import { useRightPanelStore } from "../../rightPanelStore";
import { serverEnvironment } from "../../state/server";
import { shellEnvironment } from "../../state/shell";
import { useAtomCommand } from "../../state/use-atom-command";
import { type SkillOrigin, skillOrigin } from "./skillsSection.logic";

const ORIGIN_LABEL: Record<SkillOrigin, string> = {
  personal: "Yours",
  project: "This project",
  plugin: "Plugin",
  other: "Other",
};

/** The SKILL.md body without its YAML front matter. */
function skillBody(head: string): string {
  return head.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

/** The eye button and the card it opens: the whole description, the start of SKILL.md, and links. */
export function SkillCard(props: {
  skill: ServerProviderSkill;
  environmentId: EnvironmentId;
  threadRef: ScopedThreadRef;
}) {
  const { skill } = props;
  const inspectSkill = useAtomCommand(serverEnvironment.inspectSkill, { reportFailure: false });
  const openInEditor = useAtomCommand(shellEnvironment.openInEditor, { reportFailure: true });
  const [details, setDetails] = useState<SkillInspectResult | null>(null);

  const load = () => {
    if (details !== null) return;
    void inspectSkill({ environmentId: props.environmentId, input: { path: skill.path } }).then(
      (result) => {
        if (result._tag === "Success") setDetails(result.value);
      },
    );
  };
  const file = details?.file ?? null;

  return (
    <Popover onOpenChange={(open) => open && load()}>
      <PopoverTrigger
        render={<Button size="icon-xs" variant="ghost-muted" aria-label={`View ${skill.name}`} />}
      >
        <EyeIcon aria-hidden />
      </PopoverTrigger>
      <PopoverPopup side="left" align="start" sideOffset={12} className="w-80">
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-sm text-foreground">{skill.name}</span>
            <span className="shrink-0 rounded-full border px-2 py-px text-2xs text-muted-foreground">
              {ORIGIN_LABEL[skillOrigin(skill)]}
            </span>
          </div>
          <p className="max-h-32 overflow-y-auto text-foreground/90 leading-relaxed">
            {skill.description ?? skill.shortDescription ?? "No description."}
          </p>
          {details === null ? (
            <p className="text-muted-foreground">Loading SKILL.md…</p>
          ) : (
            <pre className="max-h-40 overflow-hidden rounded-md bg-muted/60 px-2.5 py-2 font-mono text-2xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {skillBody(details.head).slice(0, 900)}
            </pre>
          )}
          <span className="truncate font-mono text-2xs text-muted-foreground/80">
            {file ?? skill.path}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="xs"
              variant="outline"
              disabled={file === null}
              onClick={() => file && useRightPanelStore.getState().openFile(props.threadRef, file)}
            >
              <FileTextIcon aria-hidden />
              Open SKILL.md
            </Button>
            {details?.githubUrl ? (
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  details.githubUrl && void readLocalApi()?.shell.openExternal(details.githubUrl)
                }
              >
                <ExternalLinkIcon aria-hidden />
                GitHub
              </Button>
            ) : null}
            <Button
              size="xs"
              variant="outline"
              disabled={file === null}
              onClick={() =>
                file &&
                void openInEditor({
                  environmentId: props.environmentId,
                  input: { cwd: file, editor: "file-manager", reveal: true },
                })
              }
            >
              <FolderIcon aria-hidden />
              Finder
            </Button>
          </div>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
