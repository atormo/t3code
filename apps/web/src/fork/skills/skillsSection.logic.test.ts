import type { ServerProviderSkill } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { filterSkills, isRemovableSkill, SKILL_FILTERS, skillPinKey } from "./skillsSection.logic";

const skill = (name: string, scope: string, path = `/Users/me/.claude/skills/${name}`) =>
  ({ name, scope, path, enabled: true, description: `${name} helper` }) as ServerProviderSkill;

describe("filterSkills", () => {
  const skills = [
    skill("pptx", "user"),
    skill("deploy", "project", "/Users/me/site/.claude/skills/deploy"),
    skill("emil-color", "user"),
    skill("dxe-fluid-design", "user"),
    skill("stageshow", "user"),
    skill("slack", "other", "/Users/me/.claude/plugins/support/skills/slack"),
  ];
  const pinned = new Set([skillPinKey("claudeAgent", skills[0]!)]);
  const names = (result: ReturnType<typeof filterSkills>) => result.skills.map((s) => s.name);

  it("puts the collections first and All last, and counts every filter", () => {
    expect(SKILL_FILTERS).toEqual(["emil", "dxe", "pinned", "all"]);
    const all = filterSkills(skills, pinned, "claudeAgent", "all", "");
    expect(names(all)).toEqual([
      "pptx",
      "deploy",
      "dxe-fluid-design",
      "emil-color",
      "slack",
      "stageshow",
    ]);
    expect(all.counts).toEqual({ emil: 1, dxe: 1, pinned: 1, all: 6 });
  });

  it("narrows to a collection and a search, and only offers removal for yours and the project's", () => {
    expect(names(filterSkills(skills, pinned, "claudeAgent", "dxe", ""))).toEqual([
      "dxe-fluid-design",
    ]);
    expect(names(filterSkills(skills, pinned, "claudeAgent", "all", "SLACK"))).toEqual(["slack"]);
    expect(skills.map(isRemovableSkill)).toEqual([true, true, true, true, true, false]);
  });
});
