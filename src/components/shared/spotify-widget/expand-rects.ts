export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ExpandRects {
  cover: ElementRect;
  title: ElementRect;
  artist: ElementRect;
}

export function toElementRect(rect: DOMRect): ElementRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function captureExpandRects(elements: {
  cover: HTMLElement | null;
  title: HTMLElement | null;
  artist: HTMLElement | null;
}): ExpandRects | null {
  if (!elements.cover || !elements.title || !elements.artist) return null;

  return {
    cover: toElementRect(elements.cover.getBoundingClientRect()),
    title: toElementRect(elements.title.getBoundingClientRect()),
    artist: toElementRect(elements.artist.getBoundingClientRect()),
  };
}

export const EXPANDED_COVER_WIDTH_RATIO = 0.94;

export function getExpandedTargets(screenRect: DOMRect) {
  const coverSize = screenRect.width * EXPANDED_COVER_WIDTH_RATIO;
  const coverLeft = screenRect.left + (screenRect.width - coverSize) / 2;

  const metaHeight = 6.75 * 16;
  const blockHeight = coverSize + metaHeight;
  const coverTop =
    screenRect.top + (screenRect.height - blockHeight) / 2 - 8;

  const textLeft = screenRect.left + screenRect.width * 0.03;
  const textWidth = screenRect.width * EXPANDED_COVER_WIDTH_RATIO;
  const pillOffset = 40;
  const titleTop = coverTop + coverSize + pillOffset;
  const artistTop = titleTop + 26;

  return {
    cover: {
      top: coverTop,
      left: coverLeft,
      width: coverSize,
      height: coverSize,
    },
    title: {
      top: titleTop,
      left: textLeft,
      width: textWidth,
      height: 26,
    },
    artist: {
      top: artistTop,
      left: textLeft,
      width: textWidth,
      height: 20,
    },
  };
}
