import { screen } from "@testing-library/react";
import { NowAdminPanel } from "./now-admin-panel";
import { renderWithIntl } from "@/test-utils/render-with-intl";

const mockUpsertMutateAsync = jest.fn().mockResolvedValue({ id: "now-1" });
const mockInvalidate = jest.fn().mockResolvedValue(undefined);
const mockRouterRefresh = jest.fn();

interface MockParser<T> {
  defaultValue?: T;
}

jest.mock("nuqs", () => {
  return {
    useQueryState: <T,>(_key: string, parser?: MockParser<T>) => [
      parser?.defaultValue ?? "SNAPSHOT",
      jest.fn(),
    ],
    parseAsStringEnum: <T,>() => ({
      withDefault: (val: T) => ({ defaultValue: val }),
    }),
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: jest.fn(),
  }),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    useUtils: () => ({
      nowAdmin: {
        getSettings: {
          invalidate: mockInvalidate,
        },
      },
    }),
    nowAdmin: {
      getFocuses: {
        useQuery: () => ({ data: [] }),
      },
      deleteFocus: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
        }),
      },
      upsertSettings: {
        useMutation: () => ({
          mutateAsync: mockUpsertMutateAsync,
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

describe("NowAdminPanel", () => {
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

  const mockSettings = {
    id: "settings-1",
    timezone: "America/Managua",
    githubUsername: "jesushg",
    statusEmoji: "⚡",
    readingTitle: "Pragmatic Programmer",
    readingAuthors: "Andy Hunt",
    readingProgress: 50,
    watchedTitle: "Matrix",
    watchedRating: 5,
    githubRepo: "portfolio-v2",
    githubHref: "https://github.com/jesushg/portfolio-v2",
    photoUrls: ["https://example.com/photo.jpg"],
    translations: {
      "lang-en": {
        statusBody: "Building cool stuff",
        statusRelative: "yesterday",
        githubBody: "Shipping updates",
        githubRelative: "2 hours ago",
      },
    },
  };

  it("renders snapshot tab with settings form fields", () => {
    renderWithIntl(
      <NowAdminPanel
        initialTab="SNAPSHOT"
        languages={mockLanguages}
        settings={mockSettings}
        focuses={[]}
      />,
    );

    expect(screen.getByDisplayValue("America/Managua")).toBeInTheDocument();
    expect(screen.getByDisplayValue("⚡")).toBeInTheDocument();
  });

  it("switches tabs and renders focuses list", () => {
    renderWithIntl(
      <NowAdminPanel
        initialTab="FOCUSES"
        languages={mockLanguages}
        settings={mockSettings}
        focuses={[]}
      />,
    );

    expect(
      screen.getByRole("tab", { name: /focos|focuses/i }),
    ).toBeInTheDocument();
  });
});
