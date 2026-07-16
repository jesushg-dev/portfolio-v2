import { XMLParser } from "fast-xml-parser";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

const paragraphFragmentParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["w:r", "w:t", "w:rPr"].includes(tagName),
  allowBooleanAttributes: true,
  trimValues: false,
});

/** Parse a single <w:p>...</w:p> XML fragment into a fast-xml-parser node. */
export function parseParagraphFragment(
  paraXml: string,
): Record<string, unknown> {
  const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<root xmlns:w="${W_NS}">${paraXml}</root>`;
  const parsed = paragraphFragmentParser.parse(wrapped) as Record<
    string,
    unknown
  >;
  const root = parsed.root as Record<string, unknown> | undefined;
  const rawPara = root?.["w:p"];
  if (Array.isArray(rawPara)) {
    return rawPara[0] as Record<string, unknown>;
  }
  return (rawPara ?? {}) as Record<string, unknown>;
}
