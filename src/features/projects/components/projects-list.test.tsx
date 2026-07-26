import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ProjectsList } from "./projects-list";
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
    useQueryState: (key: string) => [key === "title" ? "Portfolio" : key === "type" ? ["FULLSTACK"] : null, jest.fn()],
    useQueryStates: () => [{}, jest.fn()],
    parseAsInteger: createParser(),
    parseAsString: createParser(),
    parseAsArrayOf: jest.fn(() => createParser()),
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
      projectsAdmin: { getMine: { invalidate: jest.fn() } },
    }),
    skillsAdmin: {
      getMine: {
        useQuery: () => ({ data: { data: [{ id: "sk1", title: "React" }] } }),
      },
    },
    projectsAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "p1",
                translations: [{ appLanguageId: "l1", title: "Portfolio Website", description: "Personal website project" }],
                title: { l1: { title: "Portfolio Website" } },
                description: { l1: { description: "Personal website project" } },
                type: "FULLSTACK",
                featured: true,
                order: 1,
                skillIds: ["sk1"],
              },
              {
                // empty skillIds → covers the `skillTitles.length > 0 ? ... : "-"` branch
                // no translations → covers `|| t("untitled")` and `|| t("noTranslation")` branches
                id: "p2",
                translations: [],
                title: {},
                description: {},
                type: null, // ← covers `row.original.type ?? "-"` branch
                featured: false,
                order: 2,
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

describe("ProjectsList", () => {
  const defaultProps = {
    initialProjects: [],
    languages: [{ id: "l1", code: "en", name: "English", isDefault: true, createdAt: new Date(), updatedAt: new Date() }],
    locale: "en" as const,
    pageCount: 1,
    totalCount: 2,
  };

  it("renders projects list and row content with active filters", () => {
    renderWithIntl(<ProjectsList {...defaultProps} />);

    expect(screen.getByText("Portfolio Website")).toBeInTheDocument();
  });

  it("renders skill titles for projects with skills", () => {
    renderWithIntl(<ProjectsList {...defaultProps} />);
    // sk1 maps to "React" → skillTitles.length > 0 branch
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("triggers deletion on delete button click", async () => {
    renderWithIntl(<ProjectsList {...defaultProps} />);

    const deleteBtns = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  }, 30000);
});
