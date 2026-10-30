import { screen } from "@testing-library/react";
import React from "react";
import { emptyProcessPageTranslationFields } from "@/features/process-pages/lib/process-page-editor-dto";
import { emptyProcessPageContent } from "@/features/process-pages/lib/process-page-content";
import { ProcessPagesList } from "./process-pages-list";
import { renderWithIntl } from "@/test-utils/render-with-intl";

jest.mock("nuqs", () => {
  const createParser = () => {
    const parser = {
      withOptions: () => parser,
      withDefault: () => parser,
    };
    return parser;
  };
  return {
    useQueryState: () => [null, jest.fn()],
    useQueryStates: () => [{}, jest.fn()],
    parseAsInteger: createParser(),
    parseAsString: createParser(),
    parseAsArrayOf: jest.fn(() => createParser()),
  };
});

jest.mock("nuqs/server", () => ({
  createParser: () => ({
    withOptions: () => ({}),
    withDefault: (val: unknown) => val,
  }),
}));

jest.mock("@/lib/parsers", () => ({
  getSortingStateParser: () => ({
    withOptions: () => ({
      withDefault: (val: unknown) => val,
    }),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      processPagesAdmin: {
        getMine: {
          invalidate: jest.fn(),
        },
      },
    }),
    processPagesAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "page-1",
                slug: "how-i-use-ai",
                template: "WORKFLOW",
                isPublished: true,
                showInNav: true,
                order: 0,
                navIcon: "Bot",
                translations: {
                  "lang-en": {
                    menuTitle: "How I use AI",
                  },
                },
                contentByLanguage: {
                  "lang-en": {
                    sections: [{ type: "hero" }],
                  },
                },
              },
            ],
            pageCount: 1,
            totalCount: 1,
          },
          isFetching: false,
        }),
      },
      deleteItem: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      deleteMany: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      updateItem: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

describe("ProcessPagesList", () => {
  const mockLanguages = [
    {
      id: "lang-en",
      code: "en",
      name: "English",
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("renders table with title, slug, and language badge", () => {
    renderWithIntl(
      <ProcessPagesList
        initialPages={[
          {
            id: "page-1",
            slug: "how-i-use-ai",
            template: "WORKFLOW",
            isPublished: true,
            showInNav: true,
            order: 0,
            navIcon: "Bot",
            translations: {
              "lang-en": {
                ...emptyProcessPageTranslationFields,
                menuTitle: "How I use AI",
              },
            },
            contentByLanguage: {
              "lang-en": emptyProcessPageContent(),
            },
          },
        ]}
        pageCount={1}
        totalCount={1}
        languages={mockLanguages}
      />,
    );

    expect(screen.getByText("How I use AI")).toBeInTheDocument();
    expect(screen.getByText("how-i-use-ai")).toBeInTheDocument();
    expect(screen.getByText("en")).toBeInTheDocument();
  });
});
