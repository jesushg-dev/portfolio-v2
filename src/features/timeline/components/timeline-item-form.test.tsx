import { screen, fireEvent, waitFor } from "@testing-library/react";
import { TimelineItemForm } from "./timeline-item-form";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { AppLanguage } from "@prisma/client";
import type { TimelineFormDTO } from "../lib/timeline-editor-dto";

const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "tl-1" });
const mockCreateMutateAsync = jest.fn().mockResolvedValue({ id: "tl-2" });
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
      timelineAdmin: {
        invalidate: mockInvalidate,
      },
    }),
    timelineAdmin: {
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

const mockInitialData: TimelineFormDTO = {
  id: "tl-1",
  organization: "Acme Corp",
  location: "New York, NY",
  category: "WORK",
  startDate: "2022-01-01",
  endDate: "2023-01-01",
  current: false,
  images: [{ url: "https://example.com/logo.png" }],
  roles: [
    {
      title: "Senior Engineer",
      startDate: "2022-01-01",
      endDate: "2023-01-01",
    },
  ],
  skillIds: ["sk-1"],
  translations: {
    "lang-en": {
      title: "Software Engineer",
      description: "Worked on core frontend systems",
    },
    "lang-es": {
      title: "Ingeniero de Software",
      description: "Trabajó en los sistemas frontend principales",
    },
  },
};

describe("TimelineItemForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the 4 canonical tabs and general tab by default", () => {
    renderWithIntl(
      <TimelineItemForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /content/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /roles/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /skills/i })).toBeInTheDocument();

    expect(screen.getByDisplayValue("Acme Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("New York, NY")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://example.com/logo.png"),
    ).toBeInTheDocument();
  });

  it("navigates to Content tab and renders AdminFormLanguageBar and translation fields", () => {
    renderWithIntl(
      <TimelineItemForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const contentTab = screen.getByRole("tab", { name: /content/i });
    fireEvent.click(contentTab);

    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Software Engineer")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Worked on core frontend systems"),
    ).toBeInTheDocument();
  });

  it("navigates to Roles tab, displays existing roles, and allows adding a role", () => {
    renderWithIntl(
      <TimelineItemForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const rolesTab = screen.getByRole("tab", { name: /roles/i });
    fireEvent.click(rolesTab);

    expect(screen.getByDisplayValue("Senior Engineer")).toBeInTheDocument();

    const addRoleButton = screen.getByRole("button", { name: /add role/i });
    fireEvent.click(addRoleButton);

    const titleInputs = screen.getAllByPlaceholderText(
      /senior software engineer/i,
    );
    expect(titleInputs.length).toBe(2);
  });

  it("navigates to Skills tab and displays SkillPicker with loaded options", () => {
    renderWithIntl(
      <TimelineItemForm
        initialData={mockInitialData}
        languages={mockLanguages}
      />,
    );

    const skillsTab = screen.getByRole("tab", { name: /skills/i });
    fireEvent.click(skillsTab);

    expect(screen.getAllByText("React").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(1);
  });

  it("submits the form with updated data in edit mode", async () => {
    renderWithIntl(
      <TimelineItemForm
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
        id: "tl-1",
        organization: "Acme Corp",
        roles: [
          expect.objectContaining({
            title: "Senior Engineer",
          }),
        ],
        skillIds: ["sk-1"],
      }),
    );
  });
});
