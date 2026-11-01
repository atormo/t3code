import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import {
  dedupeProviderSkillsByName,
  isProviderSkillUserInvocable,
  resolveProviderSkillsForCwd,
} from "@t3tools/client-runtime/providerSkills";
import type { EnvironmentId, ServerProviderSkill, ThreadId } from "@t3tools/contracts";
import { PinIcon, PinOffIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { ProviderInstanceIcon } from "../../components/chat/ProviderInstanceIcon";
import { ThreadDetailsSection } from "../../components/chat/ThreadDetailsSection";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { type DraftId, useComposerDraftStore } from "../../composerDraftStore";
import { readLocalApi } from "../../localApi";
import { useQuietThreadShell } from "../../state/entities";
import { useEnvironmentProviders } from "../../state/environments";
import { serverEnvironment } from "../../state/server";
import { useAtomCommand } from "../../state/use-atom-command";
import { useSkillPinsStore } from "./skillPinsStore";
import {
  groupSkills,
  isRemovableSkill,
  SKILL_GROUP_TITLE,
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
  const removeSkill = useAtomCommand(serverEnvironment.removeSkill, { reportFailure: true });
  const [query, setQuery] = useState("");
  const [removedPaths, setRemovedPaths] = useState<ReadonlySet<string>>(new Set());

  if (provider === null) return null;
  const skills = dedupeProviderSkillsByName(
    resolveProviderSkillsForCwd(provider, props.gitCwd).filter(
      (skill) => isProviderSkillUserInvocable(skill) && !removedPaths.has(skill.path),
    ),
  );
  if (skills.length === 0) return null;
  const groups = groupSkills(skills, new Set(pinned), provider.driver, query);

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
        </span>
      }
    >
      <div className="flex flex-col gap-1 px-1">
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
        <div className="max-h-96 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id} className="mt-1.5 first:mt-1">
              <div className="px-1.5 pb-0.5 text-2xs font-medium text-muted-foreground uppercase tracking-wide">
                {SKILL_GROUP_TITLE[group.id]}
              </div>
              <ul className="m-0 list-none p-0">
                {group.skills.map((skill) => {
                  const pinKey = skillPinKey(provider.driver, skill);
                  const isPinned = pinned.includes(pinKey);
                  return (
                    <li
                      key={skill.path}
                      className="group/skill relative rounded-md hover:bg-accent"
                    >
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 rounded-md px-1.5 py-1 pe-14 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        aria-label={`Add the ${skill.name} skill to your message`}
                        onClick={() => addToMessage(skill)}
                      >
                        <span className="font-mono text-xs text-foreground">{skill.name}</span>
                        <span
                          data-fork-skill-description=""
                          className="text-xs text-muted-foreground"
                        >
                          {skill.shortDescription ?? skill.description ?? ""}
                        </span>
                      </button>
                      <span className="absolute top-1 right-1 flex items-center opacity-0 focus-within:opacity-100 group-hover/skill:opacity-100">
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
              </ul>
            </div>
          ))}
        </div>
      </div>
    </ThreadDetailsSection>
  );
}
