import type { PhoneRenderer } from "./ios-device-renderer";

const sourceSelector = "[data-ios-texture-source]";
const scrollSelector = "[data-ios-texture-scroll]";
const refreshMs = 125;

function applyScroll(svg: string, source: HTMLElement) {
  const scrolls = Array.from(source.querySelectorAll(scrollSelector));
  if (!scrolls.some((element) => element.scrollTop)) return svg;
  const comma = svg.indexOf(",");
  const prefix = svg.slice(0, comma + 1);
  const doc = new DOMParser().parseFromString(
    decodeURIComponent(svg.slice(comma + 1)),
    "image/svg+xml",
  );
  doc.querySelectorAll(scrollSelector).forEach((copy, index) => {
    const scrollTop = scrolls[index]?.scrollTop ?? 0;
    if (!scrollTop) return;
    for (const child of copy.children) {
      if (child instanceof HTMLElement)
        child.style.translate = `0 ${-scrollTop}px`;
    }
  });
  return (
    prefix + encodeURIComponent(new XMLSerializer().serializeToString(doc))
  );
}

export function observeDeviceScreen(
  root: HTMLElement,
  renderer: PhoneRenderer,
) {
  let source: HTMLElement | null = null;
  let timer: number | undefined;
  let busy = false;
  let dirty = false;
  let disposed = false;
  let failedSource: HTMLElement | null = null;
  let fonts: string | undefined;

  function schedule() {
    dirty = true;
    if (disposed || busy || timer !== undefined) return;
    timer = window.setTimeout(() => {
      timer = undefined;
      void capture();
    }, refreshMs);
  }

  async function capture() {
    const next = root.querySelector<HTMLElement>(sourceSelector);
    if (source !== next) {
      source?.removeAttribute("data-ios-texture-ready");
      renderer.setScreenTexture(null);
      source = next;
    }
    if (disposed || !next || next === failedSource) return;
    const width = next.clientWidth;
    const height = next.clientHeight;
    if (!width || !height) return;
    dirty = false;
    busy = true;
    try {
      const { getFontEmbedCSS, toSvg } = await import("html-to-image");
      fonts ??= await getFontEmbedCSS(next, {
        preferredFontFormat: "woff2",
      }).catch(() => "");
      const svg = await toSvg(next, {
        width,
        height,
        fontEmbedCSS: fonts,
        style: {
          position: "relative",
          inset: "auto",
          opacity: "1",
          transform: "none",
          borderRadius: "0",
        },
      });
      const image = new Image();
      image.src = applyScroll(svg, next);
      await image.decode();
      if (disposed || !root.contains(next)) return;
      const canvas = document.createElement("canvas");
      const density = Math.min(devicePixelRatio, 1.5);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (!renderer.setScreenTexture(canvas))
        throw new Error("Screen texture upload failed");
      next.setAttribute("data-ios-texture-ready", "");
    } catch {
      failedSource = next;
      renderer.setScreenTexture(null);
      next.removeAttribute("data-ios-texture-ready");
    } finally {
      busy = false;
      if (dirty) schedule();
    }
  }

  const observer = new MutationObserver((records) => {
    if (
      records.some(({ target, attributeName }) =>
        target === root
          ? attributeName !== "style"
          : attributeName !== "data-ios-texture-ready",
      )
    )
      schedule();
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
  const events = [
    "scroll",
    "load",
    "focusin",
    "focusout",
    "transitionend",
    "animationend",
  ];
  events.forEach((event) => root.addEventListener(event, schedule, true));
  const resize = new ResizeObserver(schedule);
  resize.observe(root);
  schedule();

  return () => {
    disposed = true;
    window.clearTimeout(timer);
    observer.disconnect();
    resize.disconnect();
    events.forEach((event) => root.removeEventListener(event, schedule, true));
    source?.removeAttribute("data-ios-texture-ready");
    renderer.setScreenTexture(null);
  };
}
