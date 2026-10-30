import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { SkillsList } from "./skills-list";
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
      key === "title" ? "React" : key === "type" ? ["FRONTEND"] : null,
      jest.fn(),
    ],
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
      skillsAdmin: { invalidate: jest.fn() },
    }),
    skillsAdmin: {
      getCategories: {
        useQuery: () => ({
          data: [
            { value: "FRONTEND", count: 1 },
            { value: "BACKEND", count: 1 },
          ],
        }),
      },
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "sk1",
                translations: [{ appLanguageId: "l1", title: "React" }],
                title: "React",
                level: 90,
                type: "FRONTEND",
                order: 1,
              },
              {
                // second skill to exercise uniqueTypes options building + different type branch
                id: "sk2",
                translations: [{ appLanguageId: "l1", title: "Node.js" }],
                title: "Node.js",
                level: 80,
                type: "BACKEND",
                order: 2,
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
    appLanguagesAdmin: {
      getAll: {
        useQuery: () => ({
          data: [
            {
              id: "l1",
              code: "en",
              name: "English",
              isDefault: true,
            },
          ],
        }),
      },
    },
  },
}));

describe("SkillsList", () => {
  const defaultProps = {
    initialSkills: [],
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

  it("renders skills list and row content with active filters", () => {
    renderWithIntl(<SkillsList {...defaultProps} />);

    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders multiple skills with different types", () => {
    renderWithIntl(<SkillsList {...defaultProps} />);
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    // Both FRONTEND and BACKEND appear as type cells
    expect(screen.getAllByText("FRONTEND").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("BACKEND").length).toBeGreaterThanOrEqual(1);
  });

  it("triggers deletion on delete button click", async () => {
    renderWithIntl(<SkillsList {...defaultProps} />);

    const deleteBtns = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled();
    });
  }, 30000);

  it("renders category chips using canonical pill tabs", () => {
    renderWithIntl(<SkillsList {...defaultProps} />);
    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
  });

  it("shows bulk bar when rows are selected", () => {
    renderWithIntl(<SkillsList {...defaultProps} />);

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
