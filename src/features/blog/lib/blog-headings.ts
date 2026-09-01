export interface BlogHeading {
  id: string;
  text: string;
  level: number;
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function isSeriesTag(tag: string) {
  return tag.toLowerCase().startsWith("series:");
}

export function extractWords(serializedContent: string) {
  try {
    const parsed = JSON.parse(serializedContent) as { content?: unknown[] };
    const text = JSON.stringify(parsed.content ?? [])
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .trim();
    return text.length > 0 ? text.split(/\s+/).length : 0;
  } catch {
    const text = serializedContent.replace(/[^\p{L}\p{N}\s]+/gu, " ").trim();
    return text.length > 0 ? text.split(/\s+/).length : 0;
  }
}

export function extractHeadings(serializedContent: string): BlogHeading[] {
  try {
    const parsed = JSON.parse(serializedContent) as {
      content?: {
        type?: string;
        attrs?: { level?: number };
        content?: { text?: string }[];
      }[];
    };
    const nodes = parsed.content ?? [];
    return nodes
      .filter(
        (node) => node.type === "heading" && (node.attrs?.level ?? 0) <= 3,
      )
      .map((node, index) => {
        const text = (node.content ?? [])
          .map((child) => child.text ?? "")
          .join("")
          .trim();
        const safeText = text.length > 0 ? text : `section-${index + 1}`;
        return {
          id: slugifyHeading(safeText),
          text: safeText,
          level: node.attrs?.level ?? 2,
        };
      });
  } catch {
    return [];
  }
}
