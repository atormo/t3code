import { describe, expect, it } from "vite-plus/test";

import { isClearCommand } from "./clearCommand";

describe("isClearCommand", () => {
  it("matches /clear alone and nothing else", () => {
    expect(isClearCommand("/clear")).toBe(true);
    expect(isClearCommand("  /CLEAR \n")).toBe(true);
    expect(isClearCommand("/clear the cache")).toBe(false);
    expect(isClearCommand("please /clear")).toBe(false);
  });
});
