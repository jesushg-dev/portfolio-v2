import { matchCertificationSkillKeys } from "./match-certification-skills";

const skills = [
  { key: "React", title: "React" },
  { key: "Nextjs", title: "Next.js" },
  { key: "Typescript", title: "TypeScript" },
  { key: "Nodejs", title: "Node.js" },
];

describe("matchCertificationSkillKeys", () => {
  it("matches explicit technology patterns from EN/ES titles", () => {
    expect(
      matchCertificationSkillKeys(
        {
          translations: [
            { locale: "en", title: "Professional Next.js and TypeScript" },
            { locale: "es", title: "Next.js profesional" },
          ],
        },
        skills,
      ),
    ).toEqual(expect.arrayContaining(["Nextjs", "Typescript"]));
  });

  it("matches skill titles by whole-word fallback", () => {
    expect(
      matchCertificationSkillKeys(
        {
          translations: [{ locale: "en", title: "Advanced React workshop" }],
        },
        skills,
      ),
    ).toContain("React");
  });

  it("respects maxSkills", () => {
    const keys = matchCertificationSkillKeys(
      {
        translations: [
          {
            locale: "en",
            title: "React Next.js TypeScript Node.js bootcamp",
          },
        ],
      },
      skills,
      { maxSkills: 2 },
    );
    expect(keys).toHaveLength(2);
  });

  it("ignores skills that are not in the candidate list", () => {
    expect(
      matchCertificationSkillKeys(
        { translations: [{ locale: "en", title: "GraphQL specialist" }] },
        skills,
      ),
    ).toEqual([]);
  });
});
