import { describe, expect, it } from "vite-plus/test";

import { isDisclosureOpen, openDisclosure } from "./disclosureDefaults";

describe("disclosure defaults", () => {
  it("reads the set as opened ids by default and as closed ids when open by default", () => {
    expect(isDisclosureOpen(new Set(["a"]), "a", false)).toBe(true);
    expect(isDisclosureOpen(new Set(["a"]), "b", false)).toBe(false);
    expect(isDisclosureOpen(new Set(["a"]), "a", true)).toBe(false);
    expect(isDisclosureOpen(undefined, "b", true)).toBe(true);
  });

  it("opens a disclosure either way without touching an already open one", () => {
    const closedByYou = new Set(["a"]);
    expect([...openDisclosure(closedByYou, "a", true)]).toEqual([]);
    expect([...openDisclosure(new Set<string>(), "a", false)]).toEqual(["a"]);
    const already = new Set<string>();
    expect(openDisclosure(already, "b", true)).toBe(already);
  });
});
