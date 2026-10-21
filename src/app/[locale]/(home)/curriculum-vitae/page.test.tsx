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
  getPathname: jest.fn(({ href }: { href: string }) => href),
  usePathname: jest.fn(() => "/"),
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
  redirect: jest.fn(),
  routing: { locales: ["en", "es", "nl"], defaultLocale: "en" },
}));

jest.mock("next-intl/server", () => {
  const createMockTranslator = () => {
    const labels: Record<string, string> = {
      "actions.goBack": "Go Back",
      "actions.download": "Download CV",
      codedWith: "This CV was created using ReactJS.",
      title: "Curriculum Vitae",
      "unpublished.title": "CV isn’t public yet",
      "unpublished.description":
        "This résumé is still a draft. You can keep browsing the rest of the portfolio.",
      "unpublished.backHome": "Back to home",
    };
    const t = (key: string) => labels[key] ?? key;
    t.has = (key: string) => key in labels;
    t.raw = (key: string) => labels[key] ?? key;
    t.rich = (key: string) => labels[key] ?? key;
    t.markup = (key: string) => labels[key] ?? key;
    return t;
  };

  return {
    getTranslations: jest.fn(() => Promise.resolve(createMockTranslator())),
    setRequestLocale: jest.fn(),
  };
});

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
    appLanguage: {
      findMany: jest.fn(() =>
        Promise.resolve([
          { id: "lang-en", code: "en" },
          { id: "lang-es", code: "es" },
          { id: "lang-nl", code: "nl" },
        ]),
      ),
    },
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
    cvPersonalReference: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/email/resend", () => ({
  canDeliverPortfolioCvEmail: jest.fn(() => Promise.resolve(false)),
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
  isPublished: true,
  displayName: "Jane Doe",
  logoInitials: null,
  logoImageUrl: null,
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
    translations: [
      {
        id: "abt-1",
        cvAboutMeId: "about-1",
        appLanguageId: "lang-en",
        aboutMe: "About me text",
        createdAt: new Date(),
      },
    ],
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

  it("shows an unpublished state instead of 404 for draft tenants", async () => {
    mockResolveTenant.mockResolvedValue({
      ...tenant,
      isPrimary: false,
      isPublished: false,
    });

    const ui = await CvPageView({ locale: "en" });
    renderWithIntl(ui as ReactElement);

    expect(
      screen.getByRole("heading", { name: /public yet/i }),
    ).toBeInTheDocument();
    expect(mockNotFound).not.toHaveBeenCalled();
    expect(mockDb.cvHeader.findUnique).not.toHaveBeenCalled();
  });

  it("renders pdfMode preview when pdfMode is true", async () => {
    mockResolveTenant.mockResolvedValue(tenant);
    mockDbHappyPath();

    const ui = await CvPageView({ locale: "en", pdfMode: true });
    const { container } = renderWithIntl(ui as ReactElement);

    expect(container.querySelector("#cv-public-preview")).toBeInTheDocument();
  });
});

describe("CvPage", () => {
  it("passes locale to CvPageView", async () => {
    const ui = await CvPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });

    expect(ui.type).toBe(CvPageView);
    expect(ui.props).toEqual({
      locale: "en",
      pdfMode: false,
      paginatePdfPages: false,
    });
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
      translations: [{ appLanguageId: "lang-en", aboutMe: "Bio" }],
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
