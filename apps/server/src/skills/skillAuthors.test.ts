import { describe, expect, it } from "vite-plus/test";

import {
  authorFromFrontMatter,
  authorFromLicense,
  authorFromPluginManifest,
  authorFromSkillLock,
} from "./skillAuthors.ts";

describe("skill authors", () => {
  it("reads the skills lock written by `npx skills add`", () => {
    const lock = {
      skills: {
        stageshow: {
          source: "benjitaylor/skills",
          sourceType: "github",
          skillPath: "stageshow/SKILL.md",
        },
        slides: { source: "zara/frontend-slides", sourceType: "github", skillPath: "SKILL.md" },
      },
    };
    expect(authorFromSkillLock(lock, "stageshow")).toEqual({
      author: "benjitaylor",
      githubUrl: "https://github.com/benjitaylor/skills/tree/HEAD/stageshow",
    });
    expect(authorFromSkillLock(lock, "slides")?.githubUrl).toBe(
      "https://github.com/zara/frontend-slides",
    );
    expect(authorFromSkillLock(lock, "missing")).toBeNull();
  });

  it("reads front matter, LICENSE copyright and plugin manifests", () => {
    expect(
      authorFromFrontMatter("---\nname: x\nmetadata:\n  author: Emil Kowalski\n---\n# x"),
    ).toBe("Emil Kowalski");
    expect(authorFromFrontMatter("# no front matter")).toBeNull();
    expect(authorFromLicense("MIT License\n\nCopyright (c) 2026 Benji Taylor\n")).toBe(
      "Benji Taylor",
    );
    expect(authorFromLicense("Copyright 2024-2025 Anthropic, PBC. All rights reserved.")).toBe(
      "Anthropic, PBC",
    );
    expect(
      authorFromLicense(
        "means the copyright owner or entity authorized by the copyright owner\n   Copyright [yyyy] [name of copyright owner]",
      ),
    ).toBeNull();
    expect(authorFromPluginManifest({ author: { name: "Paper" } })).toBe("Paper");
    expect(authorFromPluginManifest({})).toBeNull();
  });
});
