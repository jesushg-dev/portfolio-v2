/**
 * Split raw document.xml into paragraph chunks in document order.
 * Returns [before, para0, between01, para1, ..., after]
 * where even-indexed entries are separators and odd-indexed are <w:p>...</w:p> blocks.
 */
export function splitIntoParagraphs(xml: string): string[] {
  return xml.split(/(<w:p[ >][\s\S]*?<\/w:p>)/g);
}

/** Return only <w:p> blocks from splitIntoParagraphs, in document order. */
export function extractParagraphXmlParts(xml: string): string[] {
  return splitIntoParagraphs(xml).filter((part) => part.startsWith("<w:p"));
}
