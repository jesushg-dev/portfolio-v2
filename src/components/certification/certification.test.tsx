import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Certification from "./certification";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockUseInfiniteQuery = jest.fn<
  {
    data?: {
      pages: {
        certificates: unknown[];
        cursor: string | null;
        hasMore: boolean;
      }[];
    };
    isLoading: boolean;
    isFetching: boolean;
    fetchNextPage: jest.Mock;
  },
  [unknown]
>();

jest.mock("@/trpc/react", () => ({
  api: {
    portfolio: {
      getCertificates: {
        useInfiniteQuery: (options: unknown) => mockUseInfiniteQuery(options),
      },
    },
  },
}));

jest.mock("@/i18n/routing", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/dynamic", () => () => {
  const NoResult = () => <div data-testid="no-result">No results</div>;
  NoResult.displayName = "NoResult";
  return NoResult;
});

const certificate = {
  id: "cert-1",
  title: "TypeScript Mastery",
  company: "Academy",
  image: null,
  url: "https://example.com",
  issuedDate: Date.now(),
  idCredential: null,
  type: ["FRONTEND"],
  userId: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Certification", () => {
  beforeEach(() => {
    mockUseInfiniteQuery.mockReset();
  });

  it("shows loading skeleton when isLoading is true", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      fetchNextPage: jest.fn(),
    });
    const { container } = renderWithIntl(
      <Certification slug={undefined as never} />,
    );
    expect(container.querySelector(".react-loading-skeleton")).toBeTruthy();
  });

  it("renders certificate items from query data", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { certificates: [certificate], cursor: "cert-1", hasMore: false },
        ],
      },
      isLoading: false,
      isFetching: false,
      fetchNextPage: jest.fn(),
    });
    renderWithIntl(<Certification slug={undefined as never} />);
    expect(screen.getByText("TypeScript Mastery")).toBeInTheDocument();
  });

  it("shows no result when data is empty", () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: { pages: [{ certificates: [], cursor: null, hasMore: false }] },
      isLoading: false,
      isFetching: false,
      fetchNextPage: jest.fn(),
    });
    renderWithIntl(<Certification slug={undefined as never} />);
    expect(screen.getByTestId("no-result")).toBeInTheDocument();
  });

  it("shows load more button when hasMore is true", async () => {
    const fetchNextPage = jest.fn();
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          { certificates: [certificate], cursor: "cert-1", hasMore: true },
        ],
      },
      isLoading: false,
      isFetching: false,
      fetchNextPage,
    });
    const user = userEvent.setup();
    renderWithIntl(<Certification slug={undefined as never} />);
    await user.click(screen.getByText("Load More"));
    expect(fetchNextPage).toHaveBeenCalled();
  });
});
