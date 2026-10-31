import { DEFAULT_CLIENT_SETTINGS } from "@t3tools/contracts/settings";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render";
import { __setClientSettingsForTests } from "../../hooks/useSettings";
import { KeepAwakeItem } from "./KeepAwake";

describe("KeepAwakeItem", () => {
  // The status bar sits outside every settings route, so the item must not need their providers.
  it("renders and toggles outside the settings scope", async () => {
    const setKeepAwake = vi.fn(() => Promise.resolve());
    __setClientSettingsForTests(DEFAULT_CLIENT_SETTINGS);
    await using stack = new AsyncDisposableStack();
    window.desktopBridge = { setKeepAwake } as unknown as NonNullable<typeof window.desktopBridge>;
    stack.defer(() => {
      delete window.desktopBridge;
    });
    await using screen = await render(<KeepAwakeItem />);

    const button = screen.getByRole("button", { name: /keep awake is on/i });
    await expect.element(button).toBeVisible();
    await button.click();
    await expect.element(page.getByRole("button", { name: /keep awake is off/i })).toBeVisible();
    expect(setKeepAwake).toHaveBeenCalledWith(false);
  });
});
