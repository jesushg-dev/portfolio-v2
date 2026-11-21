import { extractJobTools, vacancySkillSuggestions } from "./extract-job-tools";

describe("extractJobTools", () => {
  it("recognizes a verified punctuation variant and keeps ambiguous names and versions available to confirm", () => {
    const vacancy = "Stack: Next.js, AB, C++, .NET 9.";
    expect(
      vacancySkillSuggestions(vacancy, ["NextJS", "A.B", "A-B", "C", ".NET 8"]),
    ).toEqual(expect.arrayContaining(["AB", "C++", ".NET 9"]));
    expect(vacancySkillSuggestions(vacancy, ["NextJS"])).not.toContain(
      "Next.js",
    );
  });
  it("matches complete reordered terms in prose without asking to confirm known technologies", () => {
    const vacancy = "Usamos APIs REST y tokens JWT. También usamos GraphQL.";
    const declared = ["REST APIs", "JWT tokens"];
    expect(extractJobTools(vacancy, declared)).toEqual(
      expect.arrayContaining(["APIs REST", "tokens JWT"]),
    );
    expect(vacancySkillSuggestions(vacancy, declared)).toEqual(["GraphQL"]);
    expect(
      vacancySkillSuggestions(vacancy, declared, ["APIs REST", "tokens JWT"]),
    ).toEqual(["GraphQL"]);
    expect(
      vacancySkillSuggestions("Stack: APIs SOAP, Studio Visual.", [
        "REST APIs",
        "Visual Studio",
      ]),
    ).toEqual(expect.arrayContaining(["APIs SOAP", "Studio Visual"]));
  });
  it("discovers new names from the posting and keeps distinct products whole", () => {
    const vacancy =
      "Stack: emberleaf, Nimbus Ledger, VectorBloom, ASP.NET Core, MVC, C++.";
    expect(vacancySkillSuggestions(vacancy, ["C++", ".NET"])).toEqual(
      expect.arrayContaining([
        "emberleaf",
        "Nimbus Ledger",
        "VectorBloom",
        "ASP.NET Core",
        "MVC",
      ]),
    );
    expect(vacancySkillSuggestions(vacancy, ["C++", ".NET"])).not.toContain(
      ".NET",
    );
    expect(
      vacancySkillSuggestions(
        "We automate releases with quiet oak.",
        [],
        ["quiet oak", "quiet ocean"],
      ),
    ).toEqual(["quiet oak"]);
  });
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
    expect(tools).toContain(".NET Core");
    expect(tools).toContain("AWS");
  });
});
