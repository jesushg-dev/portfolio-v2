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
    useQueryState: (key: string) => [key === "title" ? "AWS" : key === "company" ? "Amazon" : null, jest.fn()],
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
      certificationsAdmin: { getMine: { invalidate: jest.fn() } },
    }),
    skillsAdmin: {
      getMine: {
        useQuery: () => ({ data: { data: [{ id: "sk1", title: "React" }] } }),
      },
    },
    certificationsAdmin: {
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
    },
  },
}));

describe("CertificationsList", () => {
  const defaultProps = {
    initialCertifications: [],
    languages: [{ id: "l1", code: "en", name: "English", isDefault: true, createdAt: new Date(), updatedAt: new Date() }],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 2,
  };

  it("renders certifications list and column headers with active filters", () => {
    renderWithIntl(<CertificationsList {...defaultProps} />);

    expect(screen.getByText("AWS Certified")).toBeInTheDocument();
    expect(screen.getByText("Amazon")).toBeInTheDocument();
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
});


