import { describe, expect, it } from "vite-plus/test";

import { boardColumnOf, dropAction, isSettled } from "./board.logic";

describe("board", () => {
  it("puts work and anything needing you ahead of Done", () => {
    expect(boardColumnOf("working", true)).toBe("working");
    expect(boardColumnOf("attention", false)).toBe("review");
    expect(boardColumnOf("unread", true)).toBe("review");
    expect(boardColumnOf(null, true)).toBe("done");
    expect(boardColumnOf(null, false)).toBe("idle");
  });

  it("reads settle and unsettle times, and maps drops to actions", () => {
    expect(isSettled({ settledAt: "2026-11-02T10:00:00Z", unsettledAt: null })).toBe(true);
    expect(
      isSettled({ settledAt: "2026-11-02T10:00:00Z", unsettledAt: "2026-11-02T11:00:00Z" }),
    ).toBe(false);
    expect(isSettled({ settledAt: null, unsettledAt: null })).toBe(false);
    expect(dropAction("idle", "done")).toBe("settle");
    expect(dropAction("done", "idle")).toBe("unsettle");
    expect(dropAction("working", "idle")).toBeNull();
  });
});
