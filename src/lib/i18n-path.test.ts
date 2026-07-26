import { localizedToInternalPath, stripLocalePrefix } from "@/lib/i18n-path";

describe("i18n-path", () => {
  it("strips locale prefix from paths", () => {
    expect(stripLocalePrefix("/es/panel")).toBe("/panel");
    expect(stripLocalePrefix("/nl/beheer")).toBe("/beheer");
    expect(stripLocalePrefix("/admin")).toBe("/admin");
    expect(stripLocalePrefix("/es")).toBe("/");
    expect(stripLocalePrefix("")).toBe("/");
  });

  it("maps localized admin paths back to internal paths", () => {
    expect(localizedToInternalPath("/es/panel", "es")).toBe("/admin");
    expect(localizedToInternalPath("/nl/beheer", "nl")).toBe("/admin");
    expect(localizedToInternalPath("/es/iniciar-sesion", "es")).toBe("/login");
    expect(localizedToInternalPath("/nl/inloggen", "nl")).toBe("/login");
  });

  it("handles string pathnames mapping like '/'", () => {
    expect(localizedToInternalPath("/", "en")).toBe("/");
    expect(localizedToInternalPath("/es", "es")).toBe("/");
  });

  it("falls back to english or internal path match", () => {
    // English path match when requesting in another locale
    expect(localizedToInternalPath("/login", "es")).toBe("/login");
  });

  it("returns stripped path when no pathnames match", () => {
    expect(localizedToInternalPath("/unknown/route", "en")).toBe("/unknown/route");
  });
});
