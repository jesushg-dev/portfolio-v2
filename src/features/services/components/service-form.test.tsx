import { screen, fireEvent, waitFor } from "@testing-library/react";
import { ServiceForm } from "./service-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { ServiceEditorDTO } from "../lib/service-editor-dto";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "srv-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "srv-2" });
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
      servicesAdmin: {
        getMine: {
          invalidate: mockInvalidate,
        },
      },
    }),
    servicesAdmin: {
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
                title: "TypeScript",
                image: "/ts.png",
                type: "FRONTEND",
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

const mockInitialData: ServiceEditorDTO = {
  id: "srv-1",
  icon: "code",
  type: "FRONTEND",
  image: "https://example.com/banner.jpg",
  statsValue: "99.9%",
  featured: true,
  isActive: true,
  order: 1,
  skillIds: ["sk-1"],
  translations: {
    "lang-en": {
      title: "Frontend Engineering",
      description: "Building responsive, modern, scalable user interfaces.",
      badge: "Popular",
      statsLabel: "Uptime",
    },
    "lang-es": {
      title: "Ingeniería Frontend",
      description:
        "Construcción de interfaces modernas, escalables y responsivas.",
      badge: "Popular",
      statsLabel: "Disponibilidad",
    },
  },
};

describe("ServiceForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders canonical line tabs and general tab by default", () => {
    renderWithIntl(
      <ServiceForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue("99.9%")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/banner.jpg"),
    ).toBeInTheDocument();
  });

  it("navigates to Content tab and renders AdminFormLanguageBar and translation fields", () => {
    renderWithIntl(
      <ServiceForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Frontend Engineering"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Building responsive, modern, scalable user interfaces.",
      ),
    ).toBeInTheDocument();
  });

  it("navigates to Skills tab and displays SkillPicker", () => {
    renderWithIntl(
      <ServiceForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const skillsTab = screen.getByRole("tab", { name: /skills/i });
    fireEvent.click(skillsTab);

    expect(screen.getAllByText("React").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(1);
  });

  it("submits the form with updated data in edit mode", async () => {
    renderWithIntl(
      <ServiceForm initialData={mockInitialData} languages={mockLanguages} />,
    );

    const submitBtn = screen.getByRole("button", { name: /save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "srv-1",
        icon: "code",
        type: "FRONTEND",
        skillIds: ["sk-1"],
      }),
    );
  });
});
