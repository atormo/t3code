import type { ServerProviderSkill } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { groupSkills, isRemovableSkill, skillPinKey } from "./skillsSection.logic";

const skill = (name: string, scope: string, path = `/Users/me/.claude/skills/${name}`) =>
  ({ name, scope, path, enabled: true, description: `${name} helper` }) as ServerProviderSkill;

describe("groupSkills", () => {
  const skills = [
    skill("pptx", "user"),
    skill("deploy", "project", "/Users/me/site/.claude/skills/deploy"),
    skill("pdf", "user"),
    skill("slack", "other", "/Users/me/.claude/plugins/support/skills/slack"),
  ];

  it("puts pinned skills first, then yours, the project's and the plugins'", () => {
    const groups = groupSkills(
      skills,
      new Set([skillPinKey("claudeAgent", skills[0]!)]),
      "claudeAgent",
      "",
    );
    expect(groups.map((group) => [group.id, group.skills.map((s) => s.name)])).toEqual([
      ["pinned", ["pptx"]],
      ["personal", ["pdf"]],
      ["project", ["deploy"]],
      ["plugin", ["slack"]],
    ]);
  });

  it("filters by name or description, and only offers removal for yours and the project's", () => {
    expect(
      groupSkills(skills, new Set(), "claudeAgent", "DEPLOY")[0]?.skills.map((s) => s.name),
    ).toEqual(["deploy"]);
    expect(skills.map(isRemovableSkill)).toEqual([true, true, true, false]);
  });
});
