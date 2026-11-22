import type { ServerProviderSkill } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { COLLECTIONS, collectionOf, groupCollectionSkills, presentSkill } from "./skillCatalog";
import { filterSkills } from "./skillsSection.logic";

const skill = (name: string, description = `${name} helper`) =>
  ({
    name,
    scope: "user",
    path: `/Users/me/.claude/skills/${name}`,
    enabled: true,
    description,
  }) as ServerProviderSkill;

describe("skill catalog", () => {
  it("files every catalog skill in exactly one section of one collection", () => {
    const names = COLLECTIONS.flatMap((c) => c.sections.flatMap((section) => section.skills));
    expect(new Set(names).size).toBe(names.length);
    expect(COLLECTIONS[0]!.sections.map((section) => section.number)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
    ]);
  });

  it("groups installed Emil skills by section and drops empty sections", () => {
    const groups = groupCollectionSkills("emil", [
      skill("emil-color"),
      skill("pdf"),
      skill("emil-prototype"),
    ]);
    expect(groups.map((group) => [group.section.number, group.skills.map((s) => s.name)])).toEqual([
      ["01", ["emil-prototype"]],
      ["02", ["emil-color"]],
    ]);
  });

  it("titles Emil's skills by hand and guesses the rest", () => {
    expect(presentSkill(skill("emil-prototype")).title).toBe("Prototyping");
    expect(collectionOf(skill("plugin:emil-color"))).toBe("emil");
    expect(collectionOf(skill("dxe"))).toBe("dxe");
    expect(presentSkill(skill("dxe")).title).toBe("DXE Review");
    const other = presentSkill(skill("gsd:add-phase", "Add a phase"));
    expect(other.title).toBe("Add Phase");
    expect(other.pitch).toBe("Add a phase");
    expect(presentSkill(skill("ui-ux-pro-max")).title).toBe("UI UX Pro Max");
  });

  it("filters to Emil's skills and finds them by their gallery title", () => {
    const skills = [skill("emil-prototype"), skill("emil-color"), skill("pdf")];
    const emil = filterSkills(skills, new Set(), "claudeAgent", "emil", "");
    expect(emil.skills.map((s) => s.name)).toEqual(["emil-color", "emil-prototype"]);
    expect(emil.counts.emil).toBe(2);
    expect(filterSkills(skills, new Set(), "claudeAgent", "all", "prototyping").counts.all).toBe(1);
  });
});
