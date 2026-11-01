import { describe, expect, it } from "vite-plus/test";

import { newlyNeedingYou, summarizeActivity } from "./activity.logic";

describe("activity", () => {
  it("sorts the most urgent first and counts each status", () => {
    const result = summarizeActivity([
      { key: "a", status: "working" },
      { key: "b", status: "unread" },
      { key: "c", status: "attention" },
    ]);
    expect(result.sorted.map((thread) => thread.key)).toEqual(["c", "b", "a"]);
    expect(result.counts).toEqual({ attention: 1, failed: 0, unread: 1, working: 1 });
  });

  it("flags threads that were working and now need you, once", () => {
    const previous = new Map([
      ["a", "working"],
      ["b", "unread"],
    ] as const);
    const now = [
      { key: "a", status: "unread" as const },
      { key: "b", status: "unread" as const },
      { key: "c", status: "attention" as const },
    ];
    expect(newlyNeedingYou(previous, now).map((thread) => thread.key)).toEqual(["a"]);
  });
});
