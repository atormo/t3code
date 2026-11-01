import { describe, expect, it } from "vite-plus/test";

import { removableSkillDirectory } from "./skillRemoval.ts";

describe("removableSkillDirectory", () => {
  it("accepts your own and project skills", () => {
    expect(removableSkillDirectory("/Users/me/.claude/skills/pptx/SKILL.md")).toBe(
      "/Users/me/.claude/skills/pptx",
    );
    expect(removableSkillDirectory("/Users/me/dev/site/.claude/skills/deploy")).toBe(
      "/Users/me/dev/site/.claude/skills/deploy",
    );
    expect(removableSkillDirectory("/Users/me/.agents/skills/design-lab/")).toBe(
      "/Users/me/.agents/skills/design-lab",
    );
  });

  it("refuses plugins, relative paths, traversal and anything that is not a skill folder", () => {
    expect(removableSkillDirectory("/Users/me/.claude/plugins/x/skills/pdf/SKILL.md")).toBeNull();
    expect(removableSkillDirectory("relative/.claude/skills/pdf")).toBeNull();
    expect(removableSkillDirectory("/Users/me/.claude/skills/../../Documents")).toBeNull();
    expect(removableSkillDirectory("/Users/me/.claude/skills")).toBeNull();
    expect(removableSkillDirectory("/Users/me/Documents/skills/pdf")).toBeNull();
  });
});
