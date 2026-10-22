import { CaseStudyContentSchema } from "./case-study";
import { ProjectTranslationFormSchema } from "./project-translation-form-schema";

it("preserves structured content when the project form validates a save", () => {
  const caseStudy = CaseStudyContentSchema.parse({
    gallery: [{ image: "/preview.jpg" }],
    sections: [
      {
        key: "approach",
        title: "Approach",
        kind: "CARDS",
        lead: "Design choices",
        items: [{ key: "decision", body: "Keep this content" }],
      },
    ],
  });
  expect(
    ProjectTranslationFormSchema.parse({
      title: "Project",
      description: "Summary",
      caseStudy,
    }).caseStudy,
  ).toEqual(caseStudy);
  expect(
    ProjectTranslationFormSchema.safeParse({
      title: "Project",
      description: "Summary",
      caseStudy: { sections: [{ key: "bad", title: "", kind: "CARDS" }] },
    }).success,
  ).toBe(false);
});
