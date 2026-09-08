/**
 * Stored media must already be a fetchable local path (`/...`) or absolute URL.
 * Public ids and other shorthand values are not resolved at runtime.
 */
export type MediaSrcKind = "empty" | "local" | "remote-url";

export function classifyMediaSrc(src: string): MediaSrcKind {
  const trimmed = src.trim();
  if (!trimmed) return "empty";
  if (trimmed.startsWith("/")) return "local";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return "remote-url";
    } catch {
      return "empty";
    }
  }

  return "empty";
}

export function isAbsoluteOrLocalImagePath(src: string): boolean {
  const kind = classifyMediaSrc(src);
  return kind === "local" || kind === "remote-url";
}

export function isRenderableProjectImage(
  src: string | null | undefined,
): boolean {
  return isAbsoluteOrLocalImagePath(src?.trim() ?? "");
}
