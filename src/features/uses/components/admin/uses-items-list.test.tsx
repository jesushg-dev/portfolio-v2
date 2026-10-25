import { screen } from "@testing-library/react";
import { UsesItemsList } from "./uses-items-list";
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
      usesAdmin: {
        getMine: {
          invalidate: jest.fn(),
        },
      },
    }),
    usesAdmin: {
      getMine: {
        useQuery: () => ({
          data: {
            data: [
              {
                id: "item-1",
                type: "EVERYDAY",
                href: "https://apple.com/macbook-pro",
                image: "https://example.com/mac.jpg",
                order: 0,
                translations: {
                  "lang-en": {
                    title: "MacBook Pro 16",
                    description: "Main development workstation",
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
    },
  },
}));

describe("UsesItemsList", () => {
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

  it("renders table with title and language badge", () => {
    renderWithIntl(
      <UsesItemsList
        type="EVERYDAY"
        initialItems={[
          {
            id: "item-1",
            type: "EVERYDAY",
            href: "https://apple.com/macbook-pro",
            image: "https://example.com/mac.jpg",
            order: 0,
            translations: {
              "lang-en": {
                title: "MacBook Pro 16",
                description: "Main development workstation",
              },
            },
          },
        ]}
        pageCount={1}
        totalCount={1}
        languages={mockLanguages}
      />,
    );

    expect(screen.getByText("MacBook Pro 16")).toBeInTheDocument();
    expect(screen.getByText("en")).toBeInTheDocument();
  });
});
