import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import { TimelineList } from "./timeline-list";

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
const mockDeleteMutation = jest.fn<unknown, []>();
const mockInvalidate = jest.fn();

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      timelineAdmin: {
        getMine: { invalidate: mockInvalidate },
      },
    }),
    timelineAdmin: {
      getMine: { useQuery: () => mockGetMineQuery() },
      deleteItem: { useMutation: () => mockDeleteMutation() },
    },
  },
}));

describe("TimelineList", () => {
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

  it("renders Add New button and table columns", () => {
    renderWithIntl(<TimelineList {...defaultProps} />);

    expect(screen.getByText("Add Entry")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Organization")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders list items", () => {
    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "tl-1",
            category: "WORK",
            organization: "Test Org",
            startDate: new Date("2020-01-01").toISOString(),
            endDate: new Date("2021-01-01").toISOString(),
            current: false,
            location: "Remote",
            translations: [
              {
                id: "t1",
                title: "Test Role",
                description: "Test Description",
                language: {
                  id: "lang-en",
                  code: "en",
                  name: "English",
                  isDefault: true,
                },
              },
            ],
            images: [],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<TimelineList {...defaultProps} />);

    expect(screen.getByText("Test Role")).toBeInTheDocument();
    expect(screen.getByText("Test Org")).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("Remote")).toBeInTheDocument();
    // Test Role description is rendered
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("handles deletion", async () => {
    const user = userEvent.setup();
    const mutateAsync = jest.fn().mockResolvedValue(true);
    mockDeleteMutation.mockReturnValue({ mutateAsync });

    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "tl-1",
            category: "WORK",
            organization: "Test Org",
            startDate: new Date("2020-01-01").toISOString(),
            endDate: null,
            current: true,
            location: "Remote",
            translations: [],
            images: [],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<TimelineList {...defaultProps} />);

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
      expect(mutateAsync).toHaveBeenCalledWith({ id: "tl-1" });
    });
  });
});
