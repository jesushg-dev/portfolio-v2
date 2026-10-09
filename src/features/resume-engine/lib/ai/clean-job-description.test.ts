import {
  sanitizeJobDescription,
  cleanJobDescription,
  processJobDescription,
  formatJobDescriptionForPrompt,
} from "./clean-job-description";

describe("Job Description Sanitization & Filter (T8)", () => {
  it("strips HTML tags and zero-width/control characters", () => {
    const raw =
      "<h1>Senior Dev</h1>\u200B<p>We are hiring\x00 a React engineer.</p>";
    const cleaned = sanitizeJobDescription(raw);
    expect(cleaned).toBe("Senior Dev We are hiring a React engineer.");
    expect(cleaned).not.toContain("<h1>");
    expect(cleaned).not.toContain("\u200B");
    expect(cleaned).not.toContain("\x00");
  });

  it("limits length to 12000 characters cleanly on paragraph boundary", () => {
    const para1 = "Paragraph 1: " + "a".repeat(7000);
    const para2 = "Paragraph 2: " + "b".repeat(6000);
    const combined = `${para1}\n\n${para2}`;

    const cleaned = sanitizeJobDescription(combined, 12000);
    expect(cleaned.length).toBeLessThanOrEqual(12000);
    expect(cleaned).toBe(para1);
  });

  it("filters out benefits and about us sections when enableSectionFilter is true", () => {
    const fullJd = `
About Us
We are a great startup building the future of coffee.

Responsibilities
Build scalable fullstack web applications using Next.js and TypeScript.
Write automated unit and integration tests.

Requirements
5+ years experience with React.
Strong communication skills.

Benefits
Health insurance, 401k, unlimited PTO, and free snacks.
    `.trim();

    const filtered = cleanJobDescription(fullJd, { enableSectionFilter: true });
    expect(filtered).toContain("Responsibilities");
    expect(filtered).toContain("Requirements");
    expect(filtered).toContain("Build scalable fullstack");
    expect(filtered).not.toContain("building the future of coffee");
    expect(filtered).not.toContain("unlimited PTO");
  });

  it("falls back to full text if no sections are detected", () => {
    const unformatted =
      "We are seeking a developer with skills in Python and Django. Must have 3+ years experience.";
    const result = cleanJobDescription(unformatted, {
      enableSectionFilter: true,
    });
    expect(result).toBe(unformatted);
  });

  it("processes job description returning sanitized text and status", () => {
    const dirty =
      "<h1>Frontend Engineer</h1>\u200B<p>Required: React, TypeScript.</p>";
    const result = processJobDescription(dirty);
    expect(result.wasSanitized).toBe(true);
    expect(result.cleanedText).toBe(
      "Frontend Engineer Required: React, TypeScript.",
    );
  });

  it("formats JD inside <job_description> tag for LLM prompt", () => {
    const formatted = formatJobDescriptionForPrompt("Senior React Engineer");
    expect(formatted).toBe(
      "<job_description>\nSenior React Engineer\n</job_description>",
    );
  });
});
