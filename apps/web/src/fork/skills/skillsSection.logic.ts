import type { ServerProviderSkill } from "@t3tools/contracts";
import { resolveProviderSkillSourceKind } from "@t3tools/client-runtime/providerSkills";

export type SkillFilter = "all" | "project" | "plugin" | "pinned";

export const SKILL_FILTER_LABEL: Record<SkillFilter, string> = {
  all: "All",
  project: "This project",
  plugin: "Plugins",
  pinned: "Pinned",
};

export function skillPinKey(driver: string, skill: Pick<ServerProviderSkill, "name">): string {
  return `${driver}:${skill.name}`;
}

function groupOf(skill: ServerProviderSkill): "personal" | "project" | "plugin" | "other" {
  switch (resolveProviderSkillSourceKind(skill)) {
    case "personal":
      return "personal";
    case "project":
    case "repo":
      return "project";
    case "app":
      return "plugin";
    default:
      return skill.path.includes("/plugins/") ? "plugin" : "other";
  }
}

/** Only your own and project skills live in folders T3 may move to the Trash. */
export function isRemovableSkill(skill: ServerProviderSkill): boolean {
  const group = groupOf(skill);
  return group === "personal" || group === "project";
}

export type SkillOrigin = ReturnType<typeof groupOf>;

export function skillOrigin(skill: ServerProviderSkill): SkillOrigin {
  return groupOf(skill);
}

/**
 * The skills a filter shows, matching `query` by name or description; pinned ones first, then by
 * name. Also counts every filter so the chips can show them.
 */
export function filterSkills(
  skills: readonly ServerProviderSkill[],
  pinnedKeys: ReadonlySet<string>,
  driver: string,
  filter: SkillFilter,
  query: string,
): { readonly skills: ServerProviderSkill[]; readonly counts: Record<SkillFilter, number> } {
  const needle = query.trim().toLowerCase();
  const isPinned = (skill: ServerProviderSkill) => pinnedKeys.has(skillPinKey(driver, skill));
  const inFilter = (skill: ServerProviderSkill, candidate: SkillFilter) =>
    candidate === "all" ||
    (candidate === "pinned" ? isPinned(skill) : groupOf(skill) === candidate);
  const matches = skills.filter(
    (skill) =>
      needle === "" ||
      skill.name.toLowerCase().includes(needle) ||
      (skill.shortDescription ?? skill.description ?? "").toLowerCase().includes(needle),
  );
  const counts = {
    all: matches.length,
    project: matches.filter((skill) => inFilter(skill, "project")).length,
    plugin: matches.filter((skill) => inFilter(skill, "plugin")).length,
    pinned: matches.filter((skill) => inFilter(skill, "pinned")).length,
  };
  return {
    counts,
    skills: matches
      .filter((skill) => inFilter(skill, filter))
      .toSorted(
        (a, b) => Number(isPinned(b)) - Number(isPinned(a)) || a.name.localeCompare(b.name),
      ),
  };
}
