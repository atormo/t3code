import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import {
  dedupeProviderSkillsByName,
  isProviderSkillUserInvocable,
  resolveProviderSkillsForCwd,
} from "@t3tools/client-runtime/providerSkills";
import type { EnvironmentId, ServerProviderSkill, ThreadId } from "@t3tools/contracts";
import {
  ChevronDownIcon,
  PinIcon,
  PinOffIcon,
  RotateCwIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { ProviderInstanceIcon } from "../../components/chat/ProviderInstanceIcon";
import { ThreadDetailsSection } from "../../components/chat/ThreadDetailsSection";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { type DraftId, useComposerDraftStore } from "../../composerDraftStore";
import { cn } from "../../lib/utils";
import { readLocalApi } from "../../localApi";
import { useQuietThreadShell } from "../../state/entities";
import { useEnvironmentProviders } from "../../state/environments";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { useSkillPinsStore } from "./skillPinsStore";
import { SkillCard } from "./SkillCard";
import {
  filterSkills,
  isRemovableSkill,
  SKILL_FILTER_LABEL,
  type SkillFilter,
  skillPinKey,
} from "./skillsSection.logic";
import "./skills.css";

/**
 * Every skill the thread's provider offers, with pinned ones on top. Clicking one adds it to the
 * message you are writing, like choosing it with `$`.
 */
export function ThreadSkillsSection(props: {
  environmentId: EnvironmentId;
  threadId: ThreadId;
  draftId?: DraftId | undefined;
  isServerThread: boolean;
  gitCwd: string | null;
  onComposerFocusRequest: () => void;
}) {
  const threadRef = scopeThreadRef(props.environmentId, props.threadId);
  const target = props.draftId ?? threadRef;
  const shell = useQuietThreadShell(props.isServerThread ? threadRef : null);
  const draftProvider = useComposerDraftStore(
    (store) => store.getComposerDraft(target)?.activeProvider ?? null,
  );
  const providers = useEnvironmentProviders().get(props.environmentId) ?? [];
  const instanceId = draftProvider ?? shell?.providerInstanceId ?? null;
  const provider =
    providers.find((candidate) => candidate.instanceId === instanceId) ??
    providers.find((candidate) => candidate.driver === "claudeAgent") ??
    null;
  const pinned = useSkillPinsStore((store) => store.pinned);
  const togglePin = useSkillPinsStore((store) => store.toggle);
  const collapsed = useSkillPinsStore((store) => store.collapsed);
  const setCollapsed = useSkillPinsStore((store) => store.setCollapsed);
  const [filter, setFilter] = useState<SkillFilter>("all");
  const removeSkill = useAtomCommand(serverEnvironment.removeSkill, { reportFailure: true });
  const getSkillAuthors = useAtomCommand(serverEnvironment.getSkillAuthors, {
    reportFailure: false,
  });
  const [authors, setAuthors] = useState<ReadonlyMap<string, string>>(new Map());
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders, {
    reportFailure: false,
  });
  const [rescanning, setRescanning] = useState(false);
  const [query, setQuery] = useState("");
  const [removedPaths, setRemovedPaths] = useState<ReadonlySet<string>>(new Set());

  const skillPaths =
    provider === null
      ? []
      : resolveProviderSkillsForCwd(provider, props.gitCwd).map((skill) => skill.path);
  const skillPathsKey = skillPaths.join("\n");
  const loadAuthors = useEffectEvent(() => {
    if (skillPaths.length === 0) return;
    void getSkillAuthors({ environmentId: props.environmentId, input: { paths: skillPaths } }).then(
      (result) => {
        if (result._tag !== "Success") return;
        setAuthors(
          new Map(
            result.value.authors.flatMap((entry) =>
              entry.author === null ? [] : [[entry.path, entry.author] as const],
            ),
          ),
        );
      },
    );
  });
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync, react/exhaustive-effect-dependencies -- asks the server who made each skill when the provider's skill list changes
  useEffect(() => loadAuthors(), [skillPathsKey]);

  /** Skills only rescan every few minutes; this asks the provider to look again now. */
  const rescan = () => {
    if (provider === null || rescanning) return;
    setRescanning(true);
    void refreshProviders({
      environmentId: props.environmentId,
      input: {
        instanceId: provider.instanceId,
        fresh: true,
        ...(props.gitCwd === null ? {} : { cwd: props.gitCwd }),
      },
    }).finally(() => setRescanning(false));
  };
  const rescanOnReturn = useEffectEvent(rescan);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- rescans when you come back to the app, so skills added elsewhere show up
  useEffect(() => {
    let last = 0;
    const onFocus = () => {
      if (Date.now() - last < 30_000) return;
      last = Date.now();
      rescanOnReturn();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (provider === null) return null;
  const skills = dedupeProviderSkillsByName(
    resolveProviderSkillsForCwd(provider, props.gitCwd).filter(
      (skill) => isProviderSkillUserInvocable(skill) && !removedPaths.has(skill.path),
    ),
  );
  if (skills.length === 0) return null;
  const shown = filterSkills(skills, new Set(pinned), provider.driver, filter, query);

  const addToMessage = (skill: ServerProviderSkill) => {
    const store = useComposerDraftStore.getState();
    const prompt = store.getComposerDraft(target)?.prompt ?? "";
    const separator = prompt === "" || /\s$/.test(prompt) ? "" : " ";
    store.setPrompt(target, `${prompt}${separator}$${skill.name} `);
    props.onComposerFocusRequest();
  };

  const remove = async (skill: ServerProviderSkill) => {
    const confirmed =
      (await readLocalApi()?.dialogs.confirm(
        `Move the skill "${skill.name}" to the Trash? You can restore it from there.`,
        { variant: "destructive" },
      )) ?? false;
    if (!confirmed) return;
    const result = await removeSkill({
      environmentId: props.environmentId,
      input: { path: skill.path },
    });
    if (result._tag === "Success") setRemovedPaths((paths) => new Set([...paths, skill.path]));
  };

  return (
    <ThreadDetailsSection
      headingId="thread-details-skills-heading"
      title="Skills"
      actions={
        <span className="flex items-center gap-1 text-2xs text-muted-foreground tabular-nums">
          <ProviderInstanceIcon
            driverKind={provider.driver}
            displayName={provider.displayName ?? provider.driver}
            size="compact"
          />
          {skills.length}
          <Button
            size="icon-xs"
            variant="ghost-muted"
            aria-label="Look for new skills"
            disabled={rescanning}
            onClick={rescan}
          >
            <RotateCwIcon aria-hidden className={cn(rescanning && "animate-spin")} />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost-muted"
            aria-label={collapsed ? "Show skills" : "Hide skills"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronDownIcon
              aria-hidden
              className={cn("transition-transform", collapsed && "-rotate-90")}
            />
          </Button>
        </span>
      }
    >
      {collapsed ? null : (
        <div className="flex flex-col gap-1.5 px-1">
          <label className="flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs text-muted-foreground">
            <SearchIcon aria-hidden className="size-3.5 shrink-0" />
            <input
              className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Search skills"
              aria-label="Search skills"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div role="tablist" aria-label="Skill filters" className="flex flex-wrap gap-1">
            {(["all", "project", "plugin", "pinned"] as const).map((id) =>
              id !== "all" && shown.counts[id] === 0 && filter !== id ? null : (
                <Button
                  key={id}
                  role="tab"
                  size="xs"
                  variant={filter === id ? "secondary" : "ghost-muted"}
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {SKILL_FILTER_LABEL[id]}
                  <span className="tabular-nums text-muted-foreground">{shown.counts[id]}</span>
                </Button>
              ),
            )}
          </div>
          <ul className="m-0 max-h-96 list-none overflow-y-auto p-0">
            {shown.skills.map((skill) => {
              const pinKey = skillPinKey(provider.driver, skill);
              const isPinned = pinned.includes(pinKey);
              return (
                <li key={skill.path} className="group/skill relative rounded-md hover:bg-accent">
                  <button
                    type="button"
                    className="flex w-full flex-col items-start gap-0.5 rounded-md px-1.5 py-1 pe-20 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`Add the ${skill.name} skill to your message`}
                    onClick={() => addToMessage(skill)}
                  >
                    <span className="flex items-center gap-1 font-mono text-xs text-foreground">
                      {skill.name}
                      {isPinned ? (
                        <PinIcon aria-label="Pinned" className="size-3 text-muted-foreground" />
                      ) : null}
                    </span>
                    {authors.get(skill.path) ? (
                      <span className="text-2xs text-muted-foreground/70">
                        by {authors.get(skill.path)}
                      </span>
                    ) : null}
                    <span data-fork-skill-description="" className="text-xs text-muted-foreground">
                      {skill.shortDescription ?? skill.description ?? ""}
                    </span>
                  </button>
                  <span className="absolute top-1 right-1 flex items-center opacity-0 focus-within:opacity-100 group-hover/skill:opacity-100 has-[[data-popup-open]]:opacity-100">
                    <SkillCard
                      skill={skill}
                      environmentId={props.environmentId}
                      threadRef={threadRef}
                    />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            size="icon-xs"
                            variant="ghost-muted"
                            aria-label={isPinned ? `Unpin ${skill.name}` : `Pin ${skill.name}`}
                            onClick={() => togglePin(pinKey)}
                          />
                        }
                      >
                        {isPinned ? <PinOffIcon aria-hidden /> : <PinIcon aria-hidden />}
                      </TooltipTrigger>
                      <TooltipPopup>{isPinned ? "Unpin" : "Pin to the top"}</TooltipPopup>
                    </Tooltip>
                    {isRemovableSkill(skill) ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost-muted"
                              aria-label={`Remove ${skill.name}`}
                              onClick={() => void remove(skill)}
                            />
                          }
                        >
                          <Trash2Icon aria-hidden />
                        </TooltipTrigger>
                        <TooltipPopup>Move to the Trash</TooltipPopup>
                      </Tooltip>
                    ) : null}
                  </span>
                </li>
              );
            })}
            {shown.skills.length === 0 ? (
              <li className="px-1.5 py-2 text-xs text-muted-foreground">No skills match.</li>
            ) : null}
          </ul>
        </div>
      )}
    </ThreadDetailsSection>
  );
}
