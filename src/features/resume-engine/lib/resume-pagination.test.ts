import { paginateResumeExperiences } from "./resume-pagination";
import { resumeFixture } from "./tailored-resume.fixture";
import { RESUME_TEMPLATES } from "./template-registry";

it("fits four concise roles on page one and moves longer roles to the continuation", () => {
  const source = resumeFixture("en");
  const short = {
    ...source,
    header: { ...source.header, summary: "Engineer." },
    experiences: Array.from({ length: 4 }, (_, i) => ({
      ...source.experiences[0],
      id: String(i),
      company: "Company " + i,
      companyBlurb: "Software.",
      responsibilities: ["Built applications."],
    })),
  };
  expect(
    paginateResumeExperiences(short, RESUME_TEMPLATES.v2).map(
      (page) => page.length,
    ),
  ).toEqual([4, 0]);
  const longer = {
    ...short,
    experiences: short.experiences.map((role) => ({
      ...role,
      responsibilities: Array.from({ length: 5 }, () =>
        "Delivered accessible applications for customers. ".repeat(4),
      ),
    })),
  };
  const pages = paginateResumeExperiences(longer, RESUME_TEMPLATES.v2);
  expect(pages[0].length).toBeLessThan(4);
  expect(pages.flat().map((role) => role.id)).toEqual(
    short.experiences.map((role) => role.id),
  );
});
