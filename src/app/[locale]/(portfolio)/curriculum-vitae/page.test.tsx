import { screen } from "@testing-library/react";
import type { ReactElement } from "react";

import CvPage, { generateMetadata } from "./page";
import CvPageView from "./cv-page-view";
import { db } from "@/server/db";
import { resolveTenant } from "@/lib/tenant/resolve";
import { notFound } from "next/navigation";
import { mockCvPreviewData } from "@/test-utils/fixtures/cv-data";
import { renderWithIntl } from "@/test-utils/render-with-intl";

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() =>
    Promise.resolve((key: string) => {
      const labels: Record<string, string> = {
        "actions.goBack": "Go Back",
        "actions.download": "Download CV",
        codedWith: "This CV was created using ReactJS.",
        title: "Curriculum Vitae",
      };
      return labels[key] ?? key;
    }),
  ),
  setRequestLocale: jest.fn(),
}));

interface MockDb {
  profile: { findUnique: jest.Mock };
  cvHeader: { findUnique: jest.Mock };
  cvAboutMe: { findUnique: jest.Mock };
  cvContact: { findMany: jest.Mock };
  cvEducation: { findMany: jest.Mock };
  cvLanguage: { findMany: jest.Mock };
  cvTechnicalSkill: { findMany: jest.Mock };
  cvExperience: { findMany: jest.Mock };
  cvSoftSkill: { findMany: jest.Mock };
  cvAdditionalInfo: { findMany: jest.Mock };
}

jest.mock("@/lib/tenant/resolve", () => ({
  resolveTenant: jest.fn(),
}));

jest.mock("@/server/db", () => ({
  db: {
    profile: { findUnique: jest.fn() },
    cvHeader: { findUnique: jest.fn() },
    cvAboutMe: { findUnique: jest.fn() },
    cvContact: { findMany: jest.fn() },
    cvEducation: { findMany: jest.fn() },
    cvLanguage: { findMany: jest.fn() },
    cvTechnicalSkill: { findMany: jest.fn() },
    cvExperience: { findMany: jest.fn() },
    cvSoftSkill: { findMany: jest.fn() },
    cvAdditionalInfo: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/email/resend", () => ({
  isResendConfigured: jest.fn(() => false),
}));

jest.mock("@/features/cv/components/cv-page-actions", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

const mockDb = db as unknown as MockDb;
const mockResolveTenant = jest.mocked(resolveTenant);
const mockNotFound = jest.mocked(notFound);

const tenant = {
  userId: "user-1",
  username: "janedoe",
  defaultLocale: "en" as const,
  isPrimary: true,
};

function mockDbHappyPath() {
  mockDb.profile.findUnique.mockResolvedValue(mockCvPreviewData.profile);
  mockDb.cvHeader.findUnique.mockResolvedValue(mockCvPreviewData.header);
  mockDb.cvAboutMe.findUnique.mockResolvedValue({
    id: "about-1",
    userId: "user-1",
    aboutMe: { default: "About me text" },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  mockDb.cvContact.findMany.mockResolvedValue(mockCvPreviewData.contacts);
  mockDb.cvEducation.findMany.mockResolvedValue(mockCvPreviewData.educations);
  mockDb.cvLanguage.findMany.mockResolvedValue(mockCvPreviewData.languages);
  mockDb.cvTechnicalSkill.findMany.mockResolvedValue(
    mockCvPreviewData.technicalSkills,
  );
  mockDb.cvExperience.findMany.mockResolvedValue(mockCvPreviewData.experiences);
  mockDb.cvSoftSkill.findMany.mockResolvedValue(mockCvPreviewData.softSkills);
  mockDb.cvAdditionalInfo.findMany.mockResolvedValue(
    mockCvPreviewData.additionalInformation,
  );
}

describe("CvPageView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders CV preview for a valid published tenant", async () => {
    mockResolveTenant.mockResolvedValue(tenant);
    mockDbHappyPath();

    const ui = await CvPageView({ locale: "en" });
    renderWithIntl(ui as ReactElement);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("About me text")).toBeInTheDocument();
  });

  it("calls notFound when tenant is missing", async () => {
    mockResolveTenant.mockResolvedValue(null);

    await expect(CvPageView({ locale: "en" })).rejects.toThrow("NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("calls notFound for unpublished non-primary tenants", async () => {
    mockResolveTenant.mockResolvedValue({ ...tenant, isPrimary: false });
    mockDb.profile.findUnique.mockResolvedValue({
      ...mockCvPreviewData.profile,
      isPublished: false,
    });
    mockDb.cvHeader.findUnique.mockResolvedValue(mockCvPreviewData.header);
    mockDb.cvAboutMe.findUnique.mockResolvedValue(null);
    mockDb.cvContact.findMany.mockResolvedValue([]);
    mockDb.cvEducation.findMany.mockResolvedValue([]);
    mockDb.cvLanguage.findMany.mockResolvedValue([]);
    mockDb.cvTechnicalSkill.findMany.mockResolvedValue([]);
    mockDb.cvExperience.findMany.mockResolvedValue([]);
    mockDb.cvSoftSkill.findMany.mockResolvedValue([]);
    mockDb.cvAdditionalInfo.findMany.mockResolvedValue([]);

    await expect(CvPageView({ locale: "en" })).rejects.toThrow("NOT_FOUND");
  });
});

describe("CvPage", () => {
  it("passes locale to CvPageView", async () => {
    const ui = await CvPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });

    expect(ui.type).toBe(CvPageView);
    expect(ui.props).toEqual({ locale: "en", pdfMode: false });
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses full name in title when header exists", async () => {
    mockResolveTenant.mockResolvedValue(tenant);
    mockDb.cvHeader.findUnique.mockResolvedValue(mockCvPreviewData.header);
    mockDb.cvAboutMe.findUnique.mockResolvedValue({
      id: "about-1",
      userId: "user-1",
      aboutMe: { default: "Bio" },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.title).toBe("Jane Doe - Curriculum Vitae");
    expect(metadata.description).toBe("Bio");
  });
});
