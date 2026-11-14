import { getCvDeliveryEmailContent } from "./cv-delivery-email-content";

describe("getCvDeliveryEmailContent", () => {
  it("renders dynamic tenant details correctly", () => {
    const result = getCvDeliveryEmailContent({
      locale: "en",
      ownerName: "Ada Lovelace",
      role: "Mathematician & Computing Pioneer",
      bio: "Working on the Analytical Engine.",
      portfolioUrl: "https://ada.dev",
      socialLinks: [{ label: "GitHub", url: "https://github.com/ada" }],
      location: "London, UK",
    });

    expect(result.subject).toBe(
      "Résumé – Ada Lovelace, Mathematician & Computing Pioneer",
    );
    expect(result.text).toContain("Hi,");
    expect(result.text).toContain("Working on the Analytical Engine.");
    expect(result.text).toContain("Ada Lovelace");
    expect(result.text).toContain("ada.dev");
    expect(result.text).toContain("GitHub: https://github.com/ada");
    expect(result.text).toContain("London, UK");

    expect(result.html).toContain('lang="en"');
    expect(result.html).toContain("Ada Lovelace");
    expect(result.html).toContain("ada.dev");
    expect(result.html).toContain("London, UK");
  });

  it("returns Spanish content when locale is es", () => {
    const result = getCvDeliveryEmailContent("es");
    expect(result.subject).toContain("CV – Jesús Hernández");
    expect(result.text).toContain("Hola,");
    expect(result.text).toContain("jesushg.com");
    expect(result.html).toContain('lang="es"');
    expect(result.html).toContain("#1c58da");
  });

  it("returns English content when locale is en", () => {
    const result = getCvDeliveryEmailContent("en");
    expect(result.subject).toContain("Résumé – Jesús Hernández");
    expect(result.text).toContain("Hi,");
    expect(result.text).toContain("jesushg.com");
    expect(result.html).toContain('lang="en"');
  });

  it("returns Dutch content when locale is nl", () => {
    const result = getCvDeliveryEmailContent("nl");
    expect(result.subject).toContain("CV – Jesús Hernández");
    expect(result.text).toContain("Hallo,");
    expect(result.html).toContain('lang="nl"');
  });
});
