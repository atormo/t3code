// Screenshots pasted into a message show whole: no crop, at their own shape.
// A lone one fills the message lane; several sit side by side.

/** Tallest a screenshot gets in the timeline; clicking opens the full viewer. */
const MAX_HEIGHT = "max-h-[340px]";

export const LONE_SCREENSHOT_CLASS_NAME = `block h-auto ${MAX_HEIGHT} w-auto min-w-24 max-w-full object-contain`;

export const TILED_SCREENSHOT_CLASS_NAME = `block h-auto ${MAX_HEIGHT} w-full object-contain`;

export const SCREENSHOT_TILE_CLASS_NAME = "min-w-0 overflow-hidden rounded-2xl";

/** Columns for several screenshots: two or four go in pairs, three or more in threes. */
export function screenshotColumns(count: number): 1 | 2 | 3 {
  if (count <= 1) return 1;
  if (count === 2 || count === 4) return 2;
  return 3;
}

export function screenshotGridClassName(count: number): string {
  const columns = screenshotColumns(count);
  return [
    "grid w-full items-start gap-1",
    columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-3",
  ].join(" ");
}

// The composer's preview of a pasted image keeps the image's shape instead of a square crop.

/** Longest side of the composer thumbnail; sharp at 2x on a 96px-tall tile up to 256px wide. */
const COMPOSER_THUMBNAIL_MAX_SIDE = 512;

/** Size to draw the whole image into, scaled down to fit and never up. */
export function composerThumbnailSize(
  width: number,
  height: number,
): { width: number; height: number } | null {
  if (width <= 0 || height <= 0) return null;
  const scale = Math.min(1, COMPOSER_THUMBNAIL_MAX_SIDE / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Tile around a pasted image in the composer: fixed height, width follows the image. */
export const COMPOSER_IMAGE_TILE_CLASS_NAME =
  "relative h-24 min-w-16 max-w-64 overflow-hidden rounded-lg border border-border/80";

export const COMPOSER_IMAGE_CLASS_NAME = "block h-full w-auto max-w-64 object-contain";
