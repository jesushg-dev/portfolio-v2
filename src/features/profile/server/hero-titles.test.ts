import {
  resolveHeroTitlesForLocale,
  splitAboutParagraphs,
} from "./hero-titles";

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
});
