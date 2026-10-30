import {
  resumeFixture,
  resumeSelectionFixture,
} from "./tailored-resume.fixture";
import { selectResumeSource, validateResumeCoverage } from "./resume-selection";
import { RESUME_TEMPLATES } from "./template-registry";

it("preserves selected achievement and skill priority while retaining role chronology", () => {
  const source = resumeFixture("en");
  const selection = resumeSelectionFixture(source);
  selection.experiences.reverse();
  selection.experiences.forEach((experience) => {
    experience.responsibilityIds = [...experience.responsibilityIds].reverse();
  });
  selection.skills[0].items = [...selection.skills[0].items].reverse();
  const selected = selectResumeSource(source, selection);
  expect(selected.experiences.map((experience) => experience.id)).toEqual(
    source.experiences.map((experience) => experience.id),
  );
  expect(selected.experiences[0].responsibilities).toEqual(
    [...source.experiences[0].responsibilities].reverse(),
  );
  expect(selected.skills[0].items).toEqual(selection.skills[0].items);
  expect(source.skills[0].items[0]).toBe("React");
});

it("allows a focused technology selection without removing core categories", () => {
  const source = resumeFixture("en");
  source.skills[0].items.push("Vue", "Svelte");
  const selection = resumeSelectionFixture(source);
  selection.skills[0].items = ["Next.js", "TypeScript", "React"];
  expect(() =>
    validateResumeCoverage(source, selection, RESUME_TEMPLATES.v2),
  ).not.toThrow();
  selection.skills[0].items = ["React"];
  expect(() =>
    validateResumeCoverage(source, selection, RESUME_TEMPLATES.v2),
  ).toThrow("skill group");
});

it("rejects invented or repeated skills even when their submitted order is preserved", () => {
  const source = resumeFixture("en");
  const selection = resumeSelectionFixture(source);
  selection.skills[0].items = ["React", "React", "Invented"];
  expect(() => selectResumeSource(source, selection)).toThrow(
    "duplicate selection",
  );
});
