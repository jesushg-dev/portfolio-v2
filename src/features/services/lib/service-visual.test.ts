import {
  parseServiceVisualNodes,
  resolveServiceVisualNodes,
} from "./service-visual";

describe("service visual content", () => {
  it("accepts only structured labels and rejects markup-shaped objects and oversized labels", () => {
    expect(parseServiceVisualNodes([{ label: "API" }])).toEqual([
      { label: "API" },
    ]);
    expect(
      parseServiceVisualNodes({ __html: "<script>alert(1)</script>" }),
    ).toEqual([]);
    expect(parseServiceVisualNodes([{ label: "a".repeat(49) }])).toEqual([]);
  });

  it("uses the visitor language before falling back to English", () => {
    const languages = [
      { id: "es", code: "es" },
      { id: "en", code: "en" },
    ];
    const rows = [
      { appLanguageId: "en", visualNodes: [{ label: "Services" }] },
      { appLanguageId: "es", visualNodes: [{ label: "Servicios" }] },
    ];
    expect(resolveServiceVisualNodes(rows, languages, "es")).toEqual([
      { label: "Servicios" },
    ]);
    expect(resolveServiceVisualNodes(rows, languages, "nl")).toEqual([
      { label: "Services" },
    ]);
  });
});
