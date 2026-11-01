import type { ServerProviderSkill } from "@t3tools/contracts";
import { resolveProviderSkillSourceKind } from "@t3tools/client-runtime/providerSkills";

export type SkillGroupId = "pinned" | "personal" | "project" | "plugin" | "other";

export const SKILL_GROUP_TITLE: Record<SkillGroupId, string> = {
  pinned: "Pinned",
  personal: "Yours",
  project: "This project",
  plugin: "From plugins",
  other: "Other",
};

export function skillPinKey(driver: string, skill: Pick<ServerProviderSkill, "name">): string {
  return `${driver}:${skill.name}`;
}

function groupOf(skill: ServerProviderSkill): Exclude<SkillGroupId, "pinned"> {
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

/** Pinned first, then yours, the project's and the plugins'; each by name, filtered by `query`. */
export function groupSkills(
  skills: readonly ServerProviderSkill[],
  pinnedKeys: ReadonlySet<string>,
  driver: string,
  query: string,
): Array<{ readonly id: SkillGroupId; readonly skills: ServerProviderSkill[] }> {
  const needle = query.trim().toLowerCase();
  const matches = skills
    .filter(
      (skill) =>
        needle === "" ||
        skill.name.toLowerCase().includes(needle) ||
        (skill.shortDescription ?? skill.description ?? "").toLowerCase().includes(needle),
    )
    .toSorted((a, b) => a.name.localeCompare(b.name));
  const order: SkillGroupId[] = ["pinned", "personal", "project", "plugin", "other"];
  const byGroup = new Map<SkillGroupId, ServerProviderSkill[]>(order.map((id) => [id, []]));
  for (const skill of matches) {
    const id = pinnedKeys.has(skillPinKey(driver, skill)) ? "pinned" : groupOf(skill);
    byGroup.get(id)!.push(skill);
  }
  return order
    .map((id) => ({ id, skills: byGroup.get(id)! }))
    .filter((group) => group.skills.length > 0);
}
