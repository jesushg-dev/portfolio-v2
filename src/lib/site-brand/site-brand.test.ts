import { initialsFromDisplayName, resolveSiteBrand } from "./site-brand";

describe("initialsFromDisplayName", () => {
  it("uses first letters of multiple words", () => {
    expect(initialsFromDisplayName("Ada Lovelace")).toBe("AL");
    expect(initialsFromDisplayName("Jesús Hernández González")).toBe("JHG");
  });

  it("truncates a single token", () => {
    expect(initialsFromDisplayName("Jehg")).toBe("Jehg");
    expect(initialsFromDisplayName("Supercalifragilistic")).toBe("Supercal");
  });

  it("returns empty for blank input", () => {
    expect(initialsFromDisplayName("   ")).toBe("");
  });
});

describe("resolveSiteBrand", () => {
  it("prefers logo image over initials", () => {
    expect(
      resolveSiteBrand({
        logoImageUrl: "https://cdn.example/logo.png",
        logoInitials: "JH",
        displayName: "Jane Doe",
      }),
    ).toEqual({
      mode: "image",
      imageUrl: "https://cdn.example/logo.png",
      label: "Jane Doe",
    });
  });

  it("uses configured initials when no image", () => {
    expect(
      resolveSiteBrand({
        logoInitials: "Jehg",
        displayName: "Jesús Hernández",
      }),
    ).toEqual({
      mode: "text",
      text: "Jehg",
      label: "Jesús Hernández",
    });
  });

  it("falls back to displayName initials", () => {
    expect(
      resolveSiteBrand({
        displayName: "Ada Lovelace",
        username: "ada",
      }),
    ).toEqual({
      mode: "text",
      text: "AL",
      label: "Ada Lovelace",
    });
  });

  it("falls back to username when nothing else is set", () => {
    expect(resolveSiteBrand({ username: "acme" })).toEqual({
      mode: "text",
      text: "acme",
      label: "acme",
    });
  });

  it("trims whitespace and ignores empty image urls", () => {
    expect(
      resolveSiteBrand({
        logoImageUrl: "  ",
        logoInitials: "  AB  ",
        displayName: "Ann Baker",
      }),
    ).toEqual({
      mode: "text",
      text: "AB",
      label: "Ann Baker",
    });
  });
});
