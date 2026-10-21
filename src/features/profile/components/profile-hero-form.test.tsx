import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ProfileHeroForm } from "./profile-hero-form";
import type { ProfileHeroEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";

interface UpsertHeroInput {
  fullName: string;
  photoUrl: string;
  heroSubtitleTranslations: Record<string, { text: string }>;
  heroTaglineTranslations: Record<string, { text: string }>;
}

const mockUpsertMutate = jest.fn<Promise<unknown>, [UpsertHeroInput]>();
const mockInvalidate = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      profileAdmin: {
        getHeroEditor: {
          invalidate: mockInvalidate,
        },
      },
    }),
    profileAdmin: {
      upsertHero: {
        useMutation: () => ({
          mutateAsync: mockUpsertMutate,
          isPending: false,
        }),
      },
    },
  },
}));

const mockLanguages = [
  {
    id: "lang-en",
    code: "en",
    name: "English",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "lang-es",
    code: "es",
    name: "Español",
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockInitialData: ProfileHeroEditorDTO = {
  fullName: "Jesús Hernández",
  photoUrl: "https://example.com/photo.jpg",
  heroSubtitleTranslations: {
    "lang-en": { text: "Senior Software Engineer" },
    "lang-es": { text: "Senior Software Engineer" },
  },
  heroTaglineTranslations: {
    "lang-en": { text: "Building scalable systems." },
    "lang-es": { text: "Construyendo sistemas escalables." },
  },
  heroSummaryTranslations: {
    "lang-en": { text: "Cloud and Next.js specialist." },
    "lang-es": { text: "Especialista en Cloud y Next.js." },
  },
  clientImageAltTranslations: {
    "lang-en": { text: "Profile photo" },
    "lang-es": { text: "Foto de perfil" },
  },
  heroBadgeTranslations: {
    "lang-en": { text: "Available for new projects" },
    "lang-es": { text: "Disponible para nuevos proyectos" },
  },
};

describe("ProfileHeroForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form fields for name, photo, subtitle, tagline, summary and about me", () => {
    renderWithIntl(
      <ProfileHeroForm
        languages={mockLanguages}
        initialData={mockInitialData}
      />,
    );

    expect(
      screen.getByLabelText(/display name|nombre para mostrar/i),
    ).toHaveValue("Jesús Hernández");
    expect(screen.getByLabelText(/photo url|foto de perfil/i)).toHaveValue(
      "https://example.com/photo.jpg",
    );

    const subtitleInput = document.getElementById("profile-hero-subtitle-en");
    expect(subtitleInput).toHaveValue("Senior Software Engineer");

    const taglineInput = document.getElementById("profile-hero-tagline-en");
    expect(taglineInput).toHaveValue("Building scalable systems.");

    const summaryInput = document.getElementById("profile-hero-summary-en");
    expect(summaryInput).toHaveValue("Cloud and Next.js specialist.");
  });

  it("submits updated hero fields including subtitle and tagline", async () => {
    const user = userEvent.setup();
    mockUpsertMutate.mockResolvedValueOnce({ success: true });

    renderWithIntl(
      <ProfileHeroForm
        languages={mockLanguages}
        initialData={mockInitialData}
      />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /save changes|guardar cambios/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpsertMutate).toHaveBeenCalled();
    });

    const callPayload = mockUpsertMutate.mock.calls[0]?.[0];
    expect(callPayload?.fullName).toBe("Jesús Hernández");
    expect(callPayload?.photoUrl).toBe("https://example.com/photo.jpg");
    expect(callPayload?.heroSubtitleTranslations["lang-en"]?.text).toBe(
      "Senior Software Engineer",
    );
    expect(callPayload?.heroTaglineTranslations["lang-en"]?.text).toBe(
      "Building scalable systems.",
    );
  });
});
