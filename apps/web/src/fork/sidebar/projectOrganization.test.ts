import { describe, expect, it } from "vite-plus/test";

import type { SidebarProjectGroup } from "../../uiStateStore";
import {
  assignProjectToSpace,
  createSpace,
  deleteSpace,
  ensureParkedGroup,
  isProjectInSpace,
  moveSpaceToIndexOf,
  placeGroupBefore,
  visibleSidebarGroups,
} from "./projectOrganization";

const group = (id: string, spaceId?: string): SidebarProjectGroup => ({
  id,
  name: id,
  projectKeys: [],
  ...(spaceId ? { spaceId } : {}),
});

describe("sidebar spaces", () => {
  it("shows a space's folders, unfiled folders, and that space's Parked folder last", () => {
    const groups = [
      group("parked:work", "work"),
      group("a", "work"),
      group("b", "home"),
      group("c"),
    ];
    expect(visibleSidebarGroups(groups, "work").map((g) => g.id)).toEqual([
      "a",
      "c",
      "parked:work",
    ]);
    expect(visibleSidebarGroups(groups, "home").map((g) => g.id)).toEqual([
      "b",
      "c",
      "parked:home",
    ]);
    expect(visibleSidebarGroups([], null).map((g) => g.id)).toEqual(["parked"]);
  });

  it("shows every folder and one Parked with all parked projects in the all-projects view", () => {
    const groups = [
      { ...group("parked:work", "work"), projectKeys: ["p1"] },
      { ...group("parked:home", "home"), projectKeys: ["p2"] },
      group("a", "work"),
      group("b", "home"),
    ];
    const visible = visibleSidebarGroups(groups, null);
    expect(visible.map((g) => g.id)).toEqual(["a", "b", "parked"]);
    expect(visible.at(-1)?.projectKeys).toEqual(["p1", "p2"]);
    expect(isProjectInSpace("p1", [{ id: "work", name: "Work", projectKeys: ["p1"] }], null)).toBe(
      true,
    );
  });

  it("moves a space tab to another tab's place", () => {
    const spaces = ["a", "b", "c"].map((id) => ({ id, name: id, projectKeys: [] }));
    expect(moveSpaceToIndexOf(spaces, "a", "c").map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(moveSpaceToIndexOf(spaces, "c", "a").map((s) => s.id)).toEqual(["c", "a", "b"]);
  });

  it("creates the Parked folder a move targets, in its space", () => {
    expect(ensureParkedGroup([], "parked:work")).toEqual([
      { id: "parked:work", name: "Parked", projectKeys: [], spaceId: "work" },
    ]);
    expect(ensureParkedGroup([], "a")).toEqual([]);
  });

  it("never moves Parked or puts a folder after it", () => {
    const groups = [group("a"), group("b"), group("parked")];
    expect(placeGroupBefore(groups, "b", "a").map((g) => g.id)).toEqual(["b", "a", "parked"]);
    expect(placeGroupBefore(groups, "parked", "a")).toBe(groups);
  });

  it("lets the first space adopt everything, and later spaces start empty", () => {
    const first = createSpace(
      { spaces: [], groups: [group("a"), group("parked")] },
      { id: "work", name: "Work" },
      ["p1", "p2"],
    );
    expect(first.spaces).toEqual([{ id: "work", name: "Work", projectKeys: ["p1", "p2"] }]);
    expect(first.groups.map((g) => [g.id, g.spaceId])).toEqual([
      ["a", "work"],
      ["parked:work", "work"],
    ]);
    const second = createSpace(first, { id: "home", name: "Home" }, ["p1"]);
    expect(second.spaces[1]).toEqual({ id: "home", name: "Home", projectKeys: [] });
  });

  it("files a project in one space and shows unfiled projects everywhere", () => {
    const spaces = assignProjectToSpace(
      [
        { id: "work", name: "Work", projectKeys: ["p1"] },
        { id: "home", name: "Home", projectKeys: [] },
      ],
      "p1",
      "home",
    );
    expect(isProjectInSpace("p1", spaces, "work")).toBe(false);
    expect(isProjectInSpace("p1", spaces, "home")).toBe(true);
    expect(isProjectInSpace("p2", spaces, "work")).toBe(true);
  });

  it("drops a deleted space's folders but keeps its projects", () => {
    const result = deleteSpace(
      {
        spaces: [{ id: "work", name: "Work", projectKeys: ["p1"] }],
        groups: [group("a", "work"), group("b")],
      },
      "work",
    );
    expect(result.spaces).toEqual([]);
    expect(result.groups.map((g) => g.id)).toEqual(["b"]);
  });
});
