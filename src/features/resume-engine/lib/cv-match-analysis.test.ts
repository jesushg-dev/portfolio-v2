import { CvMatchAnalysisSchema, parseMatchAnalysis } from "./cv-match-analysis";

describe("CvMatchAnalysisSchema", () => {
  it("defaults missing arrays", () => {
    const parsed = CvMatchAnalysisSchema.parse({});
    expect(parsed.keywords).toEqual([]);
    expect(parsed.skillGaps).toEqual([]);
    expect(parsed.improvements).toEqual([]);
  });

  it("parses keyword statuses", () => {
    const parsed = parseMatchAnalysis({
      keywords: [{ term: "TypeScript", status: "present" }],
      mustHaves: ["TypeScript"],
      skillGaps: ["Kubernetes"],
      touchedBlocks: ["summary"],
    });
    expect(parsed?.keywords[0]?.status).toBe("present");
    expect(parsed?.skillGaps).toEqual(["Kubernetes"]);
  });

  it("parses recruiter improvement bullets", () => {
    expect(
      parseMatchAnalysis({
        improvements: ["Be honest about Kubernetes in interview."],
      })?.improvements,
    ).toEqual(["Be honest about Kubernetes in interview."]);
  });

  it("keeps summary notes on the analysis object", () => {
    expect(
      parseMatchAnalysis({
        notes: "Emphasized .NET and React.",
        keywords: [],
      })?.notes,
    ).toBe("Emphasized .NET and React.");
  });
});
