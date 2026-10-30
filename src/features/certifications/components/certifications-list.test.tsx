import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { CertificationsList } from "./certifications-list";
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
    useQueryState: (key: string) => [
      key === "search" ? "AWS" : key === "company" ? "Amazon" : null,
      jest.fn(),
    ],
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
      certificationsAdmin: { invalidate: jest.fn() },
    }),
    skillsAdmin: {
      getMine: {
        useQuery: () => ({ data: { data: [{ id: "sk1", title: "React" }] } }),
      },
    },
    certificationsAdmin: {
      getCategories: {
        useQuery: () => ({
          data: [
            { value: "Amazon", count: 1 },
            { value: "Google", count: 1 },
          ],
        }),
      },
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "c1",
                translations: [{ appLanguageId: "l1", title: "AWS Certified" }],
                title: { l1: { title: "AWS Certified" } },
                company: "Amazon",
                url: "https://aws.amazon.com",
                issuedDate: "2024-01-01",
                idCredential: "AWS-123",
                skillIds: ["sk1"],
              },
              {
                id: "c2",
                translations: [],
                title: {},
                company: "Google",
                url: null,
                issuedDate: null,
                idCredential: null,
                // empty skillIds → covers the `skillTitles.length > 0 ? ... : "-"` branch
                skillIds: [],
              },
            ],
            totalCount: 2,
            pageCount: 1,
          },
          isFetching: false,
        }),
      },
      deleteItem: {
        useMutation: () => ({ mutateAsync: mockDelete }),
      },
      deleteMany: {
        useMutation: () => ({
          mutateAsync: jest.fn().mockResolvedValue({ count: 1 }),
        }),
      },
    },
  },
}));

describe("CertificationsList", () => {
  const defaultProps = {
    initialCertifications: [],
    languages: [
      {
        id: "l1",
        code: "en",
        name: "English",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 2,
  };

  it("renders certifications list and column headers with active filters", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);

    expect(screen.getByText("AWS Certified")).toBeInTheDocument();
    expect(screen.getAllByText("Amazon").length).toBeGreaterThanOrEqual(1);
  });

  it("renders skill titles for certifications that have skills", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);
    // sk1 maps to "React" in the skills mock → skillTitles.length > 0 branch
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("opens delete dialog and triggers deletion", async () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);

    const deleteBtns = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  }, 30000);

  it("renders category chips using canonical pill tabs", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
  });

  it("shows bulk bar when rows are selected", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: /select all/i,
    });
    fireEvent.click(selectAllCheckbox);

    expect(screen.getAllByText(/selected/i).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /clear selection/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete selected/i }),
    ).toBeInTheDocument();
  });
});
