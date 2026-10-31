import { trimMetaDescription } from "./metadata";

describe("trimMetaDescription", () => {
  it("returns short descriptions as-is", () => {
    const shortDesc = "Senior Software Engineer with 6+ years of experience.";
    expect(trimMetaDescription(shortDesc)).toBe(shortDesc);
  });

  it("trims descriptions longer than 160 characters without cutting mid-word", () => {
    const longDesc =
      "Senior Software Engineer e Ingeniero en Computación con 6+ años en .NET Core, React y SQL Server, modernizando sistemas legados y entregando software listo para producción en entornos de alto cumplimiento.";
    const result = trimMetaDescription(longDesc, 160);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.length).toBeGreaterThanOrEqual(140);
    // Should end cleanly at a word boundary without trailing punctuation
    expect(result).toBe(
      "Senior Software Engineer e Ingeniero en Computación con 6+ años en .NET Core, React y SQL Server, modernizando sistemas legados y entregando software listo",
    );
    expect(result.endsWith(" ")).toBe(false);
  });

  it("cleans trailing punctuation when trimming", () => {
    // 160 chars where truncation hits right after a comma
    const textWithComma =
      "Senior Software Engineer specializing in scalable microservices, cloud infrastructure, distributed systems, resilient databases, automated deployment pipelines, and observability.";
    const result = trimMetaDescription(textWithComma, 160);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith(",")).toBe(false);
    expect(result.endsWith(" ")).toBe(false);
  });
});
