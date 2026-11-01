import { describe, expect, it } from "vite-plus/test";

import { appBundlePath, setBundleIconScript } from "./appIcon.ts";

describe("app icon", () => {
  it("finds the bundle and builds the Get Info style icon script", () => {
    expect(appBundlePath("/Applications/T3 Code (Beta).app/Contents/MacOS/T3 Code (Beta)")).toBe(
      "/Applications/T3 Code (Beta).app",
    );
    expect(appBundlePath("/usr/local/bin/node")).toBeNull();
    expect(setBundleIconScript("/Applications/T3.app", "/r/blue.png")).toContain(
      'initWithContentsOfFile("/r/blue.png"), "/Applications/T3.app", 0)',
    );
    expect(setBundleIconScript("/Applications/T3.app", null)).toContain(
      'setIconForFileOptions($(), "/Applications/T3.app", 0)',
    );
  });
});
