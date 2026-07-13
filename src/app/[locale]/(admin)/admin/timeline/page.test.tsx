import { render, screen } from "@testing-library/react";

import TimelinePage from "./page";
import { getUserTimelineWithLanguages } from "@/features/timeline/server/timeline-queries";

jest.mock("@/features/timeline/server/timeline-queries", () => ({
  getUserTimelineWithLanguages: jest.fn(),
}));

jest.mock("@/features/timeline/components/timeline-list", () => ({
  TimelineList: () => <div data-testid="timeline-list" />,
}));

describe("TimelinePage", () => {
  beforeEach(() => {
    (getUserTimelineWithLanguages as jest.Mock).mockResolvedValue({
      data: [],
      languages: [],
      pageCount: 1,
      totalCount: 0,
    });
  });

  it("renders page title, subtitle, and list component", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({});

    const Page = await TimelinePage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-list")).toBeInTheDocument();
  });

  it("parses page and perPage from searchParams", async () => {
    const params = Promise.resolve({ locale: "en" });
    const searchParams = Promise.resolve({ page: "2", perPage: "20" });

    const Page = await TimelinePage({ params, searchParams });
    render(Page as React.ReactElement);

    expect(getUserTimelineWithLanguages).toHaveBeenCalledWith({
      page: 2,
      perPage: 20,
      sort: [],
      filters: [],
    });
  });
});
