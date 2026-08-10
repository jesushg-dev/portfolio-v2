import { screen } from "@testing-library/react";
import React from "react";
import Experiences from "./experiences";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import {
  mockAppLanguages,
  mockCvPreviewData,
} from "@/test-utils/fixtures/cv-data";
import { mapCvDataToLocalized, type CvData } from "./types";

interface RawExpTranslation {
  appLanguageId?: string;
  role?: string;
  location?: string | null;
}

interface RawResponsibilityTranslation {
  appLanguageId?: string;
  text?: string;
}

interface RawResponsibility {
  id?: string;
  order?: number;
  translations: RawResponsibilityTranslation[];
}

interface RawExperienceItem {
  id?: string;
  company?: string;
  companyLogoUrl?: string | null;
  startDate?: Date;
  endDate?: Date | null;
  current?: boolean;
  order?: number;
  translations: RawExpTranslation[];
  responsibilities?: RawResponsibility[];
}

function getLocalizedExp(list: RawExperienceItem[]) {
  const mockData = {
    ...mockCvPreviewData,
    experiences: list.map((exp) => ({
      ...exp,
      id: exp.id ?? "1",
      company: exp.company ?? "Company",
      startDate: exp.startDate ?? new Date(),
      endDate: exp.endDate ?? null,
      current: exp.current ?? false,
      companyLogoUrl: exp.companyLogoUrl ?? null,
      order: exp.order ?? 0,
      translations: exp.translations.map((t) => ({
        location: null,
        ...t,
      })),
      responsibilities: (exp.responsibilities ?? []).map((r) => ({
        order: r.order ?? 0,
        ...r,
      })),
      CvExperienceSkill: [],
    })),
  };
  return mapCvDataToLocalized(
    mockData as unknown as CvData,
    mockAppLanguages,
    "en",
  ).experiences;
}

describe("Experiences", () => {
  it("renders null when experiences array is empty", () => {
    const { container } = renderWithIntl(<Experiences experiences={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders experience details with responsibilities and formatted dates", () => {
    const list = [
      {
        id: "exp-1",
        company: "Tech Corp",
        translations: [{ appLanguageId: "lang-en", role: "Senior Developer" }],
        startDate: new Date("2020-01-01"),
        endDate: new Date("2022-01-01"),
        current: false,
        responsibilities: [
          {
            id: "resp-1",
            translations: [
              { appLanguageId: "lang-en", text: "Built REST APIs" },
            ],
          },
          {
            id: "resp-2",
            translations: [
              { appLanguageId: "lang-en", text: "Led frontend team" },
            ],
          },
        ],
      },
      {
        id: "exp-2",
        company: "Startup Inc",
        translations: [
          { appLanguageId: "lang-en", role: "Full Stack Engineer" },
        ],
        startDate: new Date("2022-02-01"),
        endDate: null,
        current: true,
        responsibilities: [],
      },
    ];

    renderWithIntl(<Experiences experiences={getLocalizedExp(list)} />);

    expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    expect(screen.getByText("Built REST APIs")).toBeInTheDocument();
    expect(screen.getByText("Led frontend team")).toBeInTheDocument();
    expect(screen.getByText("Full Stack Engineer")).toBeInTheDocument();
  });
});
