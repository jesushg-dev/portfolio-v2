import {
  buildApplicationCoverLetterUserPrompt,
  type DraftApplicationCoverLetterInput,
} from "./draft-application-cover-letter";

describe("buildApplicationCoverLetterUserPrompt", () => {
  it("includes application and candidate context", () => {
    const input: DraftApplicationCoverLetterInput = {
      position: "Frontend Engineer",
      companyName: "Acme",
      companyDescription: "Design tools",
      location: "Remote EU",
      salary: "€70k",
      notes: "Warm intro via LinkedIn",
      jobDescription: "Looking for React and TypeScript experience.",
      candidate: {
        fullName: "Alex Rivera",
        degree: "Software Engineer",
        summary: "6+ years building product UIs",
        softSkills: ["Ownership"],
        highlights: ["Shipped design system used by 40 engineers"],
      },
    };

    const prompt = buildApplicationCoverLetterUserPrompt(input);
    expect(prompt).toContain("Frontend Engineer");
    expect(prompt).toContain("Acme");
    expect(prompt).toContain("Design tools");
    expect(prompt).toContain("Remote EU");
    expect(prompt).toContain("€70k");
    expect(prompt).toContain("Warm intro via LinkedIn");
    expect(prompt).toContain("Alex Rivera");
    expect(prompt).toContain("Ownership");
    expect(prompt).toContain("design system");
  });
});
