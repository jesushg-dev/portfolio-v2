import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test-utils/render-with-intl";

import { CertificationsList } from "./certifications-list";

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
      certificationsAdmin: {
        getMine: { invalidate: mockInvalidate },
      },
    }),
    certificationsAdmin: {
      getMine: { useQuery: () => mockGetMineQuery() },
      deleteItem: { useMutation: () => mockDeleteMutation() },
    },
    skillsAdmin: {
      getMine: { useQuery: () => mockSkillsQuery() },
    },
  },
}));

describe("CertificationsList", () => {
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
    initialCertifications: [],
    languages: [
      { id: "lang-en", code: "en", name: "English", isDefault: true },
    ],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 0,
  };

  it("renders Add New button and table columns", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);

    expect(screen.getByText("Add Certification")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
  });

  it("renders list items", () => {
    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "cert-1",
            company: "Test Company",
            issuedDate: 2023,
            skillIds: [],
            translations: [
              {
                id: "t1",
                title: "Test Cert",
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

    renderWithIntl(<CertificationsList {...defaultProps} />);

    expect(screen.getByText("Test Cert")).toBeInTheDocument();
    expect(screen.getByText("Test Company")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
  });

  it("handles deletion", async () => {
    const user = userEvent.setup();
    const mutateAsync = jest.fn().mockResolvedValue(true);
    mockDeleteMutation.mockReturnValue({ mutateAsync });

    mockGetMineQuery.mockReturnValue({
      data: {
        data: [
          {
            id: "cert-1",
            company: "Test Company",
            skillIds: [],
            translations: [],
          },
        ],
        totalCount: 1,
      },
      isFetching: false,
    });

    renderWithIntl(<CertificationsList {...defaultProps} />);

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
      expect(mutateAsync).toHaveBeenCalledWith({ id: "cert-1" });
    });
  });
});
