import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import { ProjectsList } from "./projects-list";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("nuqs", () => {
  const mockNuqsProp = {
    withOptions: jest.fn().mockReturnThis(),
    withDefault: jest.fn().mockReturnThis(),
  };
  return {
    useQueryState: jest.fn(() => [undefined, jest.fn()]),
    useQueryStates: jest.fn(() => [{}, jest.fn()]),
    parseAsInteger: mockNuqsProp,
    parseAsString: mockNuqsProp,
    parseAsArrayOf: jest.fn(() => mockNuqsProp),
  };
});

jest.mock("@/lib/parsers", () => {
  const mockParserProp = {
    withOptions: jest.fn().mockReturnThis(),
    withDefault: jest.fn().mockReturnThis(),
  };
  return {
    getSortingStateParser: jest.fn(() => mockParserProp),
  };
});

const mockGetMineQuery = jest.fn<unknown, []>();
const mockSkillsQuery = jest.fn<unknown, []>();
const mockDeleteMutation = jest.fn<unknown, []>();
const mockInvalidate = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      projectsAdmin: {
        getMine: { invalidate: mockInvalidate },
      },
    }),
    projectsAdmin: {
      getMine: { useQuery: () => mockGetMineQuery() },
      deleteItem: { useMutation: () => mockDeleteMutation() },
    },
    skillsAdmin: {
      getMine: { useQuery: () => mockSkillsQuery() },
    },
  },
}));

describe("ProjectsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMineQuery.mockReturnValue({
      data: { data: [], totalCount: 0 },
      isFetching: false,
    });
    mockSkillsQuery.mockReturnValue({
      data: { data: [] },
    });
    mockDeleteMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  const defaultProps = {
    initialProjects: [],
    languages: [
      { id: "lang-en", code: "en", name: "English", isDefault: true },
    ],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 0,
  };

  it("renders Add New button and table columns", () => {
    renderWithIntl(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("Add Project")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getAllByText("Type").length).toBeGreaterThan(0);
  });

  it("renders list items", () => {
    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "proj-1",
            type: "WEB",
            skillIds: [],
            translations: [
              {
                id: "t1",
                title: "Test Project",
                description: "Project Description",
                language: {
                  id: "lang-en",
                  code: "en",
                  name: "English",
                  isDefault: true,
                },
              },
            ],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Project Description")).toBeInTheDocument();
    expect(screen.getByText("WEB")).toBeInTheDocument();
  });

  it("handles deletion", async () => {
    const user = userEvent.setup();
    const mutateAsync = jest.fn().mockResolvedValue(true);
    mockDeleteMutation.mockReturnValue({ mutateAsync });

    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "proj-1",
            type: "WEB",
            skillIds: [],
            translations: [],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<ProjectsList {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    const delBtn = buttons.find(
      (b) =>
        b.className.includes("text-destructive") ||
        b.className.includes("hover:bg-destructive"),
    );

    if (delBtn) {
      await user.click(delBtn);
    }

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ id: "proj-1" });
    });
  });
});
