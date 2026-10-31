import { describe, expect, it } from "vite-plus/test";

import { syncInTerminalScript } from "./forkUpdates.ts";

describe("syncInTerminalScript", () => {
  it("runs the sync script in the checkout, quoting awkward paths", () => {
    expect(syncInTerminalScript("/Users/me/dev/t3code")).toContain(
      `do script "cd '/Users/me/dev/t3code' && scripts/fork/sync-upstream.sh --install"`,
    );
    expect(syncInTerminalScript(`/tmp/it's "here"`)).toContain(`cd '/tmp/it'\\\\''s \\"here\\"'`);
  });
});
