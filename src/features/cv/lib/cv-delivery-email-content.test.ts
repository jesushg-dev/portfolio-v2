import { getCvDeliveryEmailContent } from "./cv-delivery-email-content";

describe("getCvDeliveryEmailContent", () => {
  it("returns Spanish content when locale is es", () => {
    const result = getCvDeliveryEmailContent("es");
    expect(result.subject).toContain("CV – Jesús Hernández");
    expect(result.text).toContain("Hola,");
    expect(result.text).toContain("Walmart Global Tech");
    expect(result.text).toContain("jesushg.com");
    expect(result.html).toContain('lang="es"');
    expect(result.html).toContain("#1c58da");
  });

  it("returns English content when locale is en", () => {
    const result = getCvDeliveryEmailContent("en");
    expect(result.subject).toContain("Résumé – Jesús Hernández");
    expect(result.text).toContain("Hi,");
    expect(result.text).toContain("Walmart Global Tech");
    expect(result.html).toContain('lang="en"');
  });

  it("returns Dutch content when locale is nl", () => {
    const result = getCvDeliveryEmailContent("nl");
    expect(result.subject).toContain("CV – Jesús Hernández");
    expect(result.text).toContain("Hallo,");
    expect(result.html).toContain('lang="nl"');
  });
});

