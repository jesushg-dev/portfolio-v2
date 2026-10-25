import { screen, fireEvent, waitFor } from "@testing-library/react";
import { CertificationForm } from "./certification-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { CertificationEditorDTO } from "../lib/certification-editor-dto";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "cert-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "cert-2" });
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
      certificationsAdmin: {
        getMine: {
          invalidate: mockInvalidate,
        },
      },
    }),
    certificationsAdmin: {
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
    skillsAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "sk-1",
                title: "React",
                image: "/react.png",
                type: "FRONTEND",
              },
              {
                id: "sk-2",
                title: "Node.js",
                image: "/node.png",
                type: "BACKEND",
              },
            ],
          },
          isLoading: false,
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

const mockInitialData: CertificationEditorDTO = {
  id: "cert-1",
  company: "Google",
  issuedDate: 2024,
  url: "https://example.com/cert/123",
  idCredential: "G-12345",
  image: "https://example.com/logo.png",
  type: ["FRONTEND"],
  skillIds: ["sk-1"],
  translations: {
    "lang-en": {
      title: "Cloud Architect Professional",
    },
    "lang-es": {
      title: "Arquitecto de Nube Profesional",
    },
  },
};

describe("CertificationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders canonical line tabs and general tab by default", () => {
    renderWithIntl(
      <CertificationForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue("Google")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/cert/123"),
    ).toBeInTheDocument();
  });

  it("navigates to Content tab and renders AdminFormLanguageBar and translation fields", () => {
    renderWithIntl(
      <CertificationForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Cloud Architect Professional"),
    ).toBeInTheDocument();
  });

  it("navigates to Skills tab and displays SkillPicker", () => {
    renderWithIntl(
      <CertificationForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const skillsTab = screen.getByRole("tab", { name: /skills/i });
    fireEvent.click(skillsTab);

    expect(screen.getAllByText("React").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Node.js").length).toBeGreaterThanOrEqual(1);
  });

  it("submits the form with updated data in edit mode", async () => {
    renderWithIntl(
      <CertificationForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "cert-1",
        company: "Google",
        issuedDate: 2024,
        skillIds: ["sk-1"],
      }),
    );
  });
});
