import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import { SoftSkillsList } from "./soft-skills-list";

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

jest.mock("@/features/soft-skills/lib/soft-skill-icons", () => ({
  resolveSoftSkillIcon: () => () => <svg data-testid="mock-icon" />,
}));

const mockGetMineQuery = jest.fn<unknown, []>();
const mockDeleteMutation = jest.fn<unknown, []>();
const mockInvalidate = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      softSkillsAdmin: {
        getMine: { invalidate: mockInvalidate },
      },
    }),
    softSkillsAdmin: {
      getMine: { useQuery: () => mockGetMineQuery() },
      deleteItem: { useMutation: () => mockDeleteMutation() },
    },
  },
}));

describe("SoftSkillsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMineQuery.mockReturnValue({
      data: { data: [], totalCount: 0 },
      isFetching: false,
    });
    mockDeleteMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  const defaultProps = {
    initialItems: [],
    languages: [
      { id: "lang-en", code: "en", name: "English", isDefault: true },
    ],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 0,
  };

  it("renders Add New and Settings buttons, and table columns", () => {
    renderWithIntl(<SoftSkillsList {...defaultProps} />);

    expect(screen.getByText("Add soft skill")).toBeInTheDocument();
    expect(screen.getByText("Background settings")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("renders list items", () => {
    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "ss-1",
            icon: "star",
            isVisible: true,
            order: 1,
            translations: [
              {
                id: "t1",
                title: "Test Soft Skill",
                description: "Test Description",
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

    renderWithIntl(<SoftSkillsList {...defaultProps} />);

    expect(screen.getByText("Test Soft Skill")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("handles deletion", async () => {
    const user = userEvent.setup();
    const mutateAsync = jest.fn().mockResolvedValue(true);
    mockDeleteMutation.mockReturnValue({ mutateAsync });

    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "ss-1",
            icon: "star",
            isVisible: true,
            order: 1,
            translations: [],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<SoftSkillsList {...defaultProps} />);

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
      expect(mutateAsync).toHaveBeenCalledWith({ id: "ss-1" });
    });
  });
});
