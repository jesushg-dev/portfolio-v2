import {
  createHeadingIdFactory,
  extractHeadings,
  extractWords,
} from "./blog-headings";

describe("blog reading helpers", () => {
  it("counts article text without JSON keys, formatting, or URLs", () => {
    expect(
      extractWords(
        JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Hola Nicaragua",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "https://example.com/many/url/words" },
                    },
                  ],
                },
              ],
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tu título" }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ),
    ).toBe(4);
  });

  it("handles empty and invalid documents", () => {
    expect(extractWords('{"type":"doc","content":[]}')).toBe(0);
    expect(extractWords("null")).toBe(0);
    expect(extractWords("<p>Hola Nicaragua</p>")).toBe(2);
    expect(extractHeadings("invalid")).toEqual([]);
  });

  it("assigns unique anchors even when an existing heading contains a suffix", () => {
    const headingId = createHeadingIdFactory();
    expect(
      ["Paso", "Paso", "Paso-2", "Paso", "!!!", ""].map(headingId),
    ).toEqual(["paso", "paso-2", "paso-2-2", "paso-3", "section", "section-2"]);
  });

  it("preserves Spanish text and generates the same anchors as the renderer", () => {
    const content = JSON.stringify({
      type: "doc",
      content: ["Configuración", "Configuración", "!!!", ""].map((text) => ({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text }],
      })),
    });
    expect(extractHeadings(content).map(({ id }) => id)).toEqual([
      "configuración",
      "configuración-2",
      "section",
      "section-2",
    ]);
  });
});
