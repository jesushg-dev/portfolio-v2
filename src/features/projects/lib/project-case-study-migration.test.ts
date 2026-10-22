import { migrateProjectCaseStudy } from "../../../../prisma/lib/project-case-study-migration";
import { CaseStudyContentSchema } from "./case-study";

describe("project case-study data cutover", () => {
  it("preserves narrative, constraints, gallery and existing section content", () => {
    const source = {
      challenge: "Hard problem",
      approach: "Important engineering approach",
      outcome: "Delivered result",
      caseStudy: {
        gallery: [{ title: "Preview", image: "/preview.jpg" }],
        constraints: ["Three locales"],
        sections: [
          {
            key: "results",
            kind: "METRICS",
            title: "Results",
            lead: "Existing result",
            items: [{ key: "users", value: "100" }],
          },
        ],
      },
    };
    const migrated = migrateProjectCaseStudy(source, "en");
    expect(
      migrated?.sections.find((section) => section.key === "challenge"),
    ).toMatchObject({
      lead: source.challenge,
      items: [{ title: "Three locales" }],
    });
    expect(
      migrated?.sections.find((section) => section.key === "approach")?.lead,
    ).toBe(source.approach);
    expect(
      migrated?.sections.find((section) => section.key === "results"),
    ).toMatchObject({
      lead: "Existing result\n\nDelivered result",
      items: [{ key: "users", value: "100" }],
    });
    expect(migrated?.gallery[0]?.image).toBe("/preview.jpg");
    expect(migrated).not.toHaveProperty("constraints");
    expect(CaseStudyContentSchema.safeParse(migrated).success).toBe(true);
  });

  it("is idempotent and merges the recovered approach into architecture", () => {
    const source = {
      approach: "Design choice",
      caseStudy: {
        sections: [
          {
            key: "architecture",
            title: "Architecture",
            kind: "LAYERS",
            lead: "Request flow",
          },
        ],
      },
    };
    const migrated = migrateProjectCaseStudy(source, "es");
    expect(migrated?.sections).toHaveLength(1);
    expect(migrated?.sections[0]?.lead).toBe("Request flow\n\nDesign choice");
    expect(
      migrateProjectCaseStudy({ ...source, caseStudy: migrated }, "es"),
    ).toEqual(migrated);
  });

  it("does not create empty case studies for catalog-only projects", () => {
    expect(migrateProjectCaseStudy({}, "en")).toBeNull();
  });

  it("normalizes nullable MongoDB embedded fields before validating", () => {
    const migrated = migrateProjectCaseStudy(
      {
        outcome: "Saved result",
        caseStudy: {
          context: null,
          gallery: null,
          constraints: null,
          sections: [
            {
              key: "results",
              title: "Results",
              kind: "METRICS",
              lead: null,
              items: [{ key: "users", value: "50", body: null, tags: null }],
            },
          ],
        },
      },
      "en",
    );
    expect(migrated?.sections[0]).toMatchObject({
      lead: "Saved result",
      items: [{ value: "50", body: "", tags: [] }],
    });
    expect(migrated?.gallery).toEqual([]);
  });
});
