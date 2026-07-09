import { localizedToInternalPath, stripLocalePrefix } from "@/lib/i18n-path";

describe("i18n-path", () => {
  it("strips locale prefix from paths", () => {
    expect(stripLocalePrefix("/es/panel")).toBe("/panel");
    expect(stripLocalePrefix("/nl/beheer")).toBe("/beheer");
    expect(stripLocalePrefix("/admin")).toBe("/admin");
  });

  it("maps localized admin paths back to internal paths", () => {
    expect(localizedToInternalPath("/es/panel", "es")).toBe("/admin");
    expect(localizedToInternalPath("/nl/beheer", "nl")).toBe("/admin");
    expect(localizedToInternalPath("/es/iniciar-sesion", "es")).toBe("/login");
    expect(localizedToInternalPath("/nl/inloggen", "nl")).toBe("/login");
  });
});
