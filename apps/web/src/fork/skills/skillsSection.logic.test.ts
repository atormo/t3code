import type { ServerProviderSkill } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { filterSkills, isRemovableSkill, skillPinKey } from "./skillsSection.logic";

const skill = (name: string, scope: string, path = `/Users/me/.claude/skills/${name}`) =>
  ({ name, scope, path, enabled: true, description: `${name} helper` }) as ServerProviderSkill;

describe("filterSkills", () => {
  const skills = [
    skill("pptx", "user"),
    skill("deploy", "project", "/Users/me/site/.claude/skills/deploy"),
    skill("pdf", "user"),
    skill("slack", "other", "/Users/me/.claude/plugins/support/skills/slack"),
  ];
  const pinned = new Set([skillPinKey("claudeAgent", skills[2]!)]);
  const names = (result: ReturnType<typeof filterSkills>) => result.skills.map((s) => s.name);

  it("lists pinned skills first and counts every filter", () => {
    const all = filterSkills(skills, pinned, "claudeAgent", "all", "");
    expect(names(all)).toEqual(["pdf", "deploy", "pptx", "slack"]);
    expect(all.counts).toEqual({ all: 4, project: 1, plugin: 1, pinned: 1 });
  });

  it("narrows to a filter and a search, and only offers removal for yours and the project's", () => {
    expect(names(filterSkills(skills, pinned, "claudeAgent", "project", ""))).toEqual(["deploy"]);
    expect(names(filterSkills(skills, pinned, "claudeAgent", "all", "SLACK"))).toEqual(["slack"]);
    expect(skills.map(isRemovableSkill)).toEqual([true, true, true, false]);
  });
});
