/** Coerce fast-xml-parser attribute/text nodes to plain strings safely. */
export function coalesceXmlText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function extractTextFromWt(wt: unknown): string {
  if (wt === undefined || wt === null) return "";
  const items = Array.isArray(wt) ? wt : [wt];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "number" || typeof item === "boolean") {
        // fast-xml-parser may coerce digit-only <w:t>2024</w:t> to a number
        return String(item);
      }
      if (typeof item === "object" && item !== null) {
        return coalesceXmlText((item as Record<string, unknown>)["#text"]);
      }
      return "";
    })
    .join("");
}
