import { screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ServicesList } from "./services-list";
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
    useQueryState: (key: string) => [key === "title" ? "Web" : null, jest.fn()],
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
      servicesAdmin: { getMine: { invalidate: jest.fn() } },
    }),
    skillsAdmin: {
      getMine: {
        useQuery: () => ({ data: { data: [{ id: "sk1", title: "React" }] } }),
      },
    },
    servicesAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "s1",
                translations: [
                  {
                    appLanguageId: "l1",
                    title: "Web Development",
                    description: "Custom website development",
                  },
                ],
                title: { l1: { title: "Web Development" } },
                description: {
                  l1: { description: "Custom website development" },
                },
                icon: "Code",
                order: 1,
                isActive: true,
                skillIds: ["sk1"],
              },
            ],
            totalCount: 1,
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

describe("ServicesList", () => {
  const defaultProps = {
    initialServices: [],
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
    totalCount: 1,
  };

  it("renders services list and row content with active filters", () => {
    renderWithIntl(<ServicesList {...defaultProps} />);

    expect(screen.getByText("Web Development")).toBeInTheDocument();
  });

  it("opens delete dialog and triggers deletion", async () => {
    renderWithIntl(<ServicesList {...defaultProps} />);

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", {
      name: /confirm|delete/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ id: "s1" });
    });
  }, 30000);
});
