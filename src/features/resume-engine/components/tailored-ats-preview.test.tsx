import {
  resumeFixture,
  resumeResponseFixture,
} from "../lib/tailored-resume.fixture";
import { render, screen } from "@testing-library/react";
import { TailoredAtsPreview } from "./tailored-ats-preview";
import { validateTailoredResume } from "../lib/tailored-resume-document";

describe("persisted resume preview", () => {
  it.each(["en", "es", "nl"] as const)(
    "renders the document's %s locale independent of interface translations",
    (locale) => {
      const drafts = {
        en: resumeFixture("en"),
        es: resumeFixture("es"),
        nl: resumeFixture("nl"),
      };
      const { document } = validateTailoredResume(
        resumeResponseFixture(drafts[locale], "v2"),
        {
          drafts,
          templateId: "v2",
          targetLocale: locale,
          jobDescription: "A software engineering role.",
        },
      );
      render(<TailoredAtsPreview snapshot={document} />);
      expect(
        screen.getByText(document.header.availability!),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(document.experiences[0].companyBlurb!),
      ).toHaveLength(3);
      expect(
        screen.getByText(
          {
            en: "January 2024 – Present",
            es: "enero de 2024 – Actualidad",
            nl: "januari 2024 – Heden",
          }[locale],
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          {
            en: "Professional experience",
            es: "Experiencia laboral",
            nl: "Werkervaring",
          }[locale],
        ),
      ).toBeInTheDocument();
    },
  );
});
