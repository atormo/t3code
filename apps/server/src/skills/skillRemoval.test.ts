import { describe, expect, it } from "vite-plus/test";

import { githubTreeUrl, removableSkillDirectory, skillFileOf } from "./skillRemoval.ts";

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

describe("skillFileOf and githubTreeUrl", () => {
  it("finds SKILL.md and links a folder inside a GitHub clone", () => {
    expect(skillFileOf("/Users/me/.claude/skills/pdf")).toBe(
      "/Users/me/.claude/skills/pdf/SKILL.md",
    );
    expect(skillFileOf("/Users/me/.claude/skills/pdf/SKILL.md")).toBe(
      "/Users/me/.claude/skills/pdf/SKILL.md",
    );
    expect(skillFileOf("../pdf")).toBeNull();
    expect(
      githubTreeUrl(
        "git@github.com:anthropics/skills.git",
        "/Users/me/.claude/plugins/skills",
        "/Users/me/.claude/plugins/skills/document/pdf",
      ),
    ).toBe("https://github.com/anthropics/skills/tree/HEAD/document/pdf");
    expect(githubTreeUrl("https://github.com/me/tools", "/r", "/r")).toBe(
      "https://github.com/me/tools",
    );
    expect(githubTreeUrl("https://gitlab.com/me/tools.git", "/r", "/r/x")).toBeNull();
  });
});
