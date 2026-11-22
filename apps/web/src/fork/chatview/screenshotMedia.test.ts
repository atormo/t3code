import { describe, expect, it } from "vite-plus/test";

import {
  LONE_SCREENSHOT_CLASS_NAME,
  TILED_SCREENSHOT_CLASS_NAME,
  composerThumbnailSize,
  screenshotColumns,
  screenshotGridClassName,
} from "./screenshotMedia";

describe("screenshotMedia", () => {
  it("never crops a screenshot", () => {
    for (const className of [LONE_SCREENSHOT_CLASS_NAME, TILED_SCREENSHOT_CLASS_NAME]) {
      expect(className).toContain("object-contain");
      expect(className).not.toContain("object-cover");
      expect(className).toContain("h-auto");
    }
  });

  it("puts several screenshots side by side", () => {
    expect(screenshotColumns(1)).toBe(1);
    expect(screenshotColumns(2)).toBe(2);
    expect(screenshotColumns(3)).toBe(3);
    expect(screenshotColumns(4)).toBe(2);
    expect(screenshotColumns(5)).toBe(3);
    expect(screenshotGridClassName(2)).toContain("grid-cols-2");
    expect(screenshotGridClassName(3)).toContain("grid-cols-3");
    expect(screenshotGridClassName(2)).toContain("items-start");
  });

  it("keeps the composer thumbnail in the image's own shape", () => {
    expect(composerThumbnailSize(2000, 1034)).toEqual({ width: 512, height: 265 });
    expect(composerThumbnailSize(800, 2400)).toEqual({ width: 171, height: 512 });
    expect(composerThumbnailSize(300, 200)).toEqual({ width: 300, height: 200 });
    expect(composerThumbnailSize(0, 200)).toBeNull();
  });
});
