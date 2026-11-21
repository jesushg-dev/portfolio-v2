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

export function getExpandedTargets(screen: HTMLElement): ExpandRects | null {
  // The phone is centered once the opening rotation and scale settle.
  const viewport = screen.ownerDocument.documentElement;
  const screenLeft = (viewport.clientWidth - screen.offsetWidth) / 2;
  const screenTop = (viewport.clientHeight - screen.offsetHeight) / 2;

  function measure(part: keyof ExpandRects): ElementRect | null {
    const element = screen.querySelector<HTMLElement>(
      `[data-spotify-flight="${part}"]`,
    );
    if (!element?.offsetWidth) return null;

    let left = screenLeft;
    let top = screenTop;
    let node: HTMLElement | null = element;
    // Layout offsets stay unchanged as the phone rotates.
    while (node && node !== screen) {
      left += node.offsetLeft;
      top += node.offsetTop;
      const parent: Element | null = node.offsetParent;
      node = parent instanceof HTMLElement ? parent : null;
    }
    return node
      ? { left, top, width: element.offsetWidth, height: element.offsetHeight }
      : null;
  }

  const cover = measure("cover");
  const title = measure("title");
  const artist = measure("artist");
  return cover && title && artist ? { cover, title, artist } : null;
}
