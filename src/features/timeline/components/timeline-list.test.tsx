import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { TimelineList } from "./timeline-list";
import { renderWithIntl } from "@/test-utils/render-with-intl";

jest.setTimeout(30000);

const mockDelete = jest.fn().mockResolvedValue({ success: true });

jest.mock("nuqs", () => {
  const createParser = () => {
    const parser = {
      withOptions: () => parser,
      withDefault: () => parser,
    };
    return parser;
  };
  return {
    useQueryState: (key: string) => [key === "title" ? "Senior" : key === "organization" ? "Tech" : key === "category" ? "WORK" : null, jest.fn()],
    useQueryStates: () => [{}, jest.fn()],
    parseAsInteger: createParser(),
    parseAsString: createParser(),
  };
});

jest.mock("@/lib/parsers", () => ({
  getSortingStateParser: () => ({
    withOptions: () => ({
      withDefault: () => ({}),
    }),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      timelineAdmin: { getMine: { invalidate: jest.fn() } },
    }),
    timelineAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                // current=true → exercises "startYear - Present" branch (line 161)
                id: "t1",
                category: "WORK",
                translations: { "lang-en": { title: "Senior Frontend Engineer", description: "Worked on UI" } },
                title: "Senior Frontend Engineer",
                organization: "Tech Corp",
                location: "Remote",
                startDate: "2022-01-01",
                endDate: null,
                current: true,   // ← was incorrectly "isCurrent" before
                order: 1,
                images: [],
              },
              {
                // current=false, endDate set → exercises "startYear - endYear" branch (line 165)
                id: "t2",
                category: "STUDY",
                translations: { "lang-en": { title: "Computer Science", description: "University" } },
                title: "Computer Science",
                organization: "MIT",
                location: null,  // ← null location → exercises `?? "-"` branch (line 279)
                startDate: "2018-01-01",
                endDate: "2022-12-31",
                current: false,
                order: 2,
                images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
              },
              {
                // null startDate → accessorFn returns 0 (line 264), getDateLabel returns noStartDate
                id: "t3",
                category: "COURSE",
                translations: {},
                title: "",
                organization: "Online",
                location: "Remote",
                startDate: null,  // ← null startDate → parseDate returns null → return 0
                endDate: null,
                current: false,
                order: 3,
                images: [],
              },
            ],
            totalCount: 3,
            pageCount: 1,
          },
          isFetching: false,
        }),
      },
      deleteItem: {
        useMutation: () => ({ mutateAsync: mockDelete }),
      },
    },
  },
}));

describe("TimelineList", () => {
  const defaultProps = {
    initialTimeline: [],
    languages: [{ id: "l1", code: "en", name: "English", isDefault: true, createdAt: new Date(), updatedAt: new Date() }],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 3,
  };

  it("renders timeline list and row content with active filters", () => {
    renderWithIntl(<TimelineList {...defaultProps} />);

    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("Tech Corp")).toBeInTheDocument();
  });

  it("renders multiple timeline items covering different date branches", () => {
    renderWithIntl(<TimelineList {...defaultProps} />);

    // t1 → current=true → "2022 - Present"
    // t2 → endDate set → "2018 - 2022"
    // t3 → startDate null → noStartDate label
    expect(screen.getByText("MIT")).toBeInTheDocument();
  });

  it("triggers deletion on delete button click", async () => {
    renderWithIntl(<TimelineList {...defaultProps} />);

    const deleteBtns = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  }, 30000);
});

