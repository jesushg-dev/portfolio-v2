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
    const parsed: unknown = JSON.parse(serializedContent);
    return countWords(collectText(parsed));
  } catch {
    return countWords(serializedContent.replace(/<[^>]*>/g, " "));
  }
}

function countWords(value: string) {
  return value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

function collectText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) return value.map(collectText).join(" ");
  const node = value as { text?: unknown; content?: unknown };
  if (typeof node.text === "string") return node.text;
  return collectText(node.content);
}

export function createHeadingIdFactory() {
  const used = new Set<string>();
  return (text: string) => {
    const base = slugifyHeading(text) || "section";
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = `${base}-${suffix++}`;
    used.add(id);
    return id;
  };
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
    const headingId = createHeadingIdFactory();
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
          id: headingId(text),
          text: safeText,
          level: node.attrs?.level ?? 2,
        };
      });
  } catch {
    return [];
  }
}
