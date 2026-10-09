import { parseManualCoverLetterOutput } from "./parse-manual-cover-letter";

describe("parseManualCoverLetterOutput", () => {
  it("parses valid JSON response", () => {
    const raw = JSON.stringify({
      subject: "Postulación para Full Stack Engineer · Acme",
      body: "Estimado equipo...",
    });

    const result = parseManualCoverLetterOutput(raw);
    expect(result.subject).toBe("Postulación para Full Stack Engineer · Acme");
    expect(result.body).toBe("Estimado equipo...");
  });

  it("parses markdown-fenced JSON response", () => {
    const raw =
      "```json\n" +
      JSON.stringify({
        subject: "Application for Senior Developer",
        body: "Dear Hiring Team,\n\nI am writing...",
      }) +
      "\n```";

    const result = parseManualCoverLetterOutput(raw);
    expect(result.subject).toBe("Application for Senior Developer");
    expect(result.body).toContain("Dear Hiring Team");
  });

  it("parses text with Subject prefix", () => {
    const raw =
      "Asunto: Postulación Senior Node.js\n\nEstimados señores,\nMe dirijo a ustedes...";
    const result = parseManualCoverLetterOutput(raw);
    expect(result.subject).toBe("Postulación Senior Node.js");
    expect(result.body).toContain("Estimados señores");
  });

  it("returns fallback for empty input", () => {
    const result = parseManualCoverLetterOutput("");
    expect(result.subject).toBe("");
    expect(result.body).toBe("");
  });
});
