import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { AboutBioForm } from "./about-bio-form";
import type { ProfileAboutEditorDTO } from "@/features/profile/lib/profile-hero-editor-dto";

interface UpsertAboutInput {
  aboutMeTranslations: Record<string, { text: string }>;
}

const mockUpsertMutate = jest.fn<Promise<unknown>, [UpsertAboutInput]>();
const mockInvalidateAbout = jest.fn();
const mockInvalidatePublic = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      profileAdmin: {
        getAboutEditor: {
          invalidate: mockInvalidateAbout,
        },
      },
      portfolio: {
        getAboutPublic: {
          invalidate: mockInvalidatePublic,
        },
      },
    }),
    profileAdmin: {
      upsertAbout: {
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

const mockInitialData: ProfileAboutEditorDTO = {
  aboutMeTranslations: {
    "lang-en": { text: "I architect high-performance cloud applications." },
    "lang-es": { text: "Diseño aplicaciones cloud de alto rendimiento." },
  },
};

describe("AboutBioForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders narrative textarea with initial data", () => {
    renderWithIntl(
      <AboutBioForm languages={mockLanguages} initialData={mockInitialData} />,
    );

    const textarea = document.getElementById("profile-about-narrative-en");
    expect(textarea).toHaveValue(
      "I architect high-performance cloud applications.",
    );
  });

  it("submits updated narrative copy and invalidates caches", async () => {
    const user = userEvent.setup();
    mockUpsertMutate.mockResolvedValueOnce({ success: true });

    renderWithIntl(
      <AboutBioForm languages={mockLanguages} initialData={mockInitialData} />,
    );

    const submitBtn = screen.getByRole("button", {
      name: /save changes|guardar cambios/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockUpsertMutate).toHaveBeenCalled();
      expect(mockInvalidateAbout).toHaveBeenCalled();
      expect(mockInvalidatePublic).toHaveBeenCalled();
    });

    const callPayload = mockUpsertMutate.mock.calls[0]?.[0];
    expect(callPayload?.aboutMeTranslations["lang-en"]?.text).toBe(
      "I architect high-performance cloud applications.",
    );
  });
});
