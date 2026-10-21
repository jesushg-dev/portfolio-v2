import { formatTailorJobContext } from "./tailor-job-context";

describe("formatTailorJobContext", () => {
  it("returns empty string when context is missing or blank", () => {
    expect(formatTailorJobContext(null)).toBe("");
    expect(formatTailorJobContext(undefined)).toBe("");
    expect(formatTailorJobContext({})).toBe("");
    expect(
      formatTailorJobContext({
        position: "  ",
        softSkills: [],
        additionalInfo: ["  "],
      }),
    ).toBe("");
  });

  it("includes application and candidate extras", () => {
    const formatted = formatTailorJobContext({
      position: "Senior Engineer",
      companyName: "Acme",
      companyDescription: "B2B SaaS",
      location: "Remote",
      salary: "€80k",
      notes: "Prefer async culture",
      softSkills: ["Ownership", "Mentoring"],
      additionalInfo: ["EU work permit"],
    });

    expect(formatted).toContain("APPLICATION CONTEXT");
    expect(formatted).toContain("Senior Engineer");
    expect(formatted).toContain("Acme");
    expect(formatted).toContain("B2B SaaS");
    expect(formatted).toContain("Remote");
    expect(formatted).toContain("€80k");
    expect(formatted).toContain("Prefer async culture");
    expect(formatted).toContain("Ownership, Mentoring");
    expect(formatted).toContain("EU work permit");
  });
});
