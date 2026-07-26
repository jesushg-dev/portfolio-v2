import {
  resolveHeroTitlesForLocale,
  splitAboutParagraphs,
  mapHeroTitlesToEditorDto,
  mapHeroTitlesToResolved,
} from "./hero-titles";

// Minimal typed helper for the DB row shape
function makeDbRow(
  order: number,
  translations: { appLanguageId: string; text: string; language: { code: string } }[],
) {
  return { order, translations };
}

describe("mapHeroTitlesToEditorDto", () => {
  it("converts DB rows to editor DTO format", () => {
    const rows = [
      makeDbRow(0, [
        { appLanguageId: "lang-en", text: "Developer", language: { code: "en" } },
        { appLanguageId: "lang-es", text: "Desarrollador", language: { code: "es" } },
      ]),
    ];

    // Cast to satisfy the complex Prisma type — fine for unit tests
    const dto = mapHeroTitlesToEditorDto(rows as Parameters<typeof mapHeroTitlesToEditorDto>[0]);

    expect(dto.titles).toHaveLength(1);
    expect(dto.titles[0]?.order).toBe(0);
    expect(dto.titles[0]?.translations["lang-en"]).toEqual({ text: "Developer" });
    expect(dto.titles[0]?.translations["lang-es"]).toEqual({ text: "Desarrollador" });
  });

  it("returns empty titles array for empty input", () => {
    const dto = mapHeroTitlesToEditorDto([]);
    expect(dto.titles).toEqual([]);
  });
});

describe("mapHeroTitlesToResolved", () => {
  it("converts DB rows to resolved format", () => {
    const rows = [
      makeDbRow(0, [
        { appLanguageId: "lang-en", text: "Engineer", language: { code: "en" } },
      ]),
    ];

    const resolved = mapHeroTitlesToResolved(rows as Parameters<typeof mapHeroTitlesToResolved>[0]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0]?.order).toBe(0);
    expect(resolved[0]?.translations).toEqual([{ languageCode: "en", text: "Engineer" }]);
  });
});

describe("resolveHeroTitlesForLocale", () => {
  it("resolves titles for the requested locale with fallback", () => {
    const titles = resolveHeroTitlesForLocale(
      [
        {
          order: 0,
          translations: [
            { languageCode: "en", text: "Full Stack Developer." },
            { languageCode: "es", text: "Desarrollador Full Stack." },
          ],
        },
        {
          order: 1,
          translations: [{ languageCode: "en", text: "Web Developer." }],
        },
      ],
      "es",
      "en",
    );

    expect(titles).toEqual(["Desarrollador Full Stack.", "Web Developer."]);
  });

  it("filters empty titles", () => {
    const titles = resolveHeroTitlesForLocale(
      [
        {
          order: 0,
          translations: [{ languageCode: "en", text: "   " }],
        },
      ],
      "en",
    );

    expect(titles).toEqual([]);
  });

  it("sorts by order before resolving", () => {
    const titles = resolveHeroTitlesForLocale(
      [
        { order: 2, translations: [{ languageCode: "en", text: "Third" }] },
        { order: 0, translations: [{ languageCode: "en", text: "First" }] },
        { order: 1, translations: [{ languageCode: "en", text: "Second" }] },
      ],
      "en",
    );
    expect(titles).toEqual(["First", "Second", "Third"]);
  });

  it("falls back to defaultLocale when requested locale has no text", () => {
    const titles = resolveHeroTitlesForLocale(
      [
        {
          order: 0,
          translations: [
            { languageCode: "en", text: "English Title" },
          ],
        },
      ],
      "es",
      "en",
    );
    expect(titles).toEqual(["English Title"]);
  });

  it("falls back to first non-empty translation when neither locale is available", () => {
    const titles = resolveHeroTitlesForLocale(
      [
        {
          order: 0,
          translations: [
            { languageCode: "nl", text: "Dutch Title" },
          ],
        },
      ],
      "es",
      "en",
    );
    expect(titles).toEqual(["Dutch Title"]);
  });
});

describe("splitAboutParagraphs", () => {
  it("splits on blank lines", () => {
    expect(
      splitAboutParagraphs("First paragraph.\n\nSecond paragraph."),
    ).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("returns empty array for blank text", () => {
    expect(splitAboutParagraphs("   ")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(splitAboutParagraphs("")).toEqual([]);
  });

  it("handles multiple blank lines as a single separator", () => {
    expect(
      splitAboutParagraphs("Para one.\n\n\n\nPara two."),
    ).toEqual(["Para one.", "Para two."]);
  });

  it("returns a single-element array for text with no blank lines", () => {
    expect(splitAboutParagraphs("Only one paragraph.")).toEqual([
      "Only one paragraph.",
    ]);
  });
});

