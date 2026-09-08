import { extractJobTools } from "./extract-job-tools";

describe("extractJobTools", () => {
  it("returns empty array for empty JD", () => {
    expect(extractJobTools("")).toEqual([]);
    expect(extractJobTools("   ")).toEqual([]);
  });

  it("extracts common keywords and languages from JD text", () => {
    const jd =
      "We are seeking a Senior Full-Stack Engineer skilled in TypeScript, Next.js, PostgreSQL, and Docker.";
    const tools = extractJobTools(jd);
    expect(tools).toContain("TypeScript");
    expect(tools).toContain("Next.js");
    expect(tools).toContain("PostgreSQL");
    expect(tools).toContain("Docker");
    expect(tools).not.toContain("Ruby");
  });

  it("extracts candidate skills mentioned in the JD and sorts them higher", () => {
    const jd = "Experience with React, GraphQL, and Redis required.";
    const candidateSkills = ["Redis", "React"];
    const tools = extractJobTools(jd, candidateSkills);
    expect(tools[0] === "React" || tools[0] === "Redis").toBe(true);
    expect(tools).toContain("GraphQL");
  });

  it("handles special characters like C# and .NET cleanly", () => {
    const jd =
      "Backend position requiring C# and .NET Core with AWS deployment.";
    const tools = extractJobTools(jd);
    expect(tools).toContain("C#");
    expect(tools).toContain(".NET");
    expect(tools).toContain("AWS");
  });
});
