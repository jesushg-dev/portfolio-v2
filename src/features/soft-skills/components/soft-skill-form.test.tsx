import { screen, fireEvent, waitFor } from "@testing-library/react";
import { SoftSkillForm } from "./soft-skill-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { SoftSkillEditorDTO } from "../lib/soft-skill-editor-dto";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "ss-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "ss-2" });
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
const mockRouterBack = jest.fn();

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({
    back: mockRouterBack,
    push: jest.fn(),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      softSkillsAdmin: {
        getMine: {
          invalidate: mockInvalidate,
        },
      },
    }),
    softSkillsAdmin: {
      createItem: {
        useMutation: () => ({
          mutateAsync: mockCreateMutateAsync,
          isPending: false,
          error: null,
        }),
      },
      updateItem: {
        useMutation: () => ({
          mutateAsync: mockUpdateMutateAsync,
          isPending: false,
          error: null,
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
  },
  {
    id: "lang-es",
    code: "es",
    name: "Español",
  },
] as unknown as AppLanguage[];

const mockInitialData: SoftSkillEditorDTO = {
  id: "ss-1",
  icon: "users",
  isVisible: true,
  featured: false,
  order: 1,
  translations: {
    "lang-en": {
      title: "Team Collaboration",
      description:
        "Effective communication across multidisciplinary engineering teams.",
      badge: "",
    },
    "lang-es": {
      title: "Colaboración en Equipo",
      description:
        "Comunicación efectiva entre equipos multidisciplinarios de ingeniería.",
      badge: "",
    },
  },
};

describe("SoftSkillForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders canonical line tabs and general tab by default", () => {
    renderWithIntl(
      <SoftSkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue("1")).toBeInTheDocument();
  });

  it("navigates to Content tab and renders AdminFormLanguageBar and translation fields", () => {
    renderWithIntl(
      <SoftSkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Team Collaboration")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Effective communication across multidisciplinary engineering teams.",
      ),
    ).toBeInTheDocument();
  });

  it("submits the form with updated data in edit mode", async () => {
    renderWithIntl(
      <SoftSkillForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "ss-1",
        icon: "users",
        order: 1,
      }),
    );
  });
});
