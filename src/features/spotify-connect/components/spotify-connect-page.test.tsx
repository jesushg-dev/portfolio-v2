import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import type { RouterOutputs } from "@/trpc/react";

import SpotifyConnectPage from "./spotify-connect-page";

type SpotifyConnectionStatusData =
  RouterOutputs["spotifyAdmin"]["getConnectionStatus"];
type SpotifyRedirectUriData = RouterOutputs["spotifyAdmin"]["getRedirectUri"];

interface MockQueryResult<TData> {
  isLoading?: boolean;
  data?: TData;
}

const mockGetConnectionStatus = jest.fn(
  (): MockQueryResult<SpotifyConnectionStatusData> => ({
    isLoading: false,
    data: {
      status: "disconnected",
      clientId: null,
      connectedAt: null,
      lastRefreshErrorAt: null,
      scope: null,
    },
  }),
);

const mockGetRedirectUri = jest.fn(
  (): MockQueryResult<SpotifyRedirectUriData> => ({
    isLoading: false,
    data: { redirectUri: "http://127.0.0.1:3000/api/spotify/callback" },
  }),
);

jest.mock("@/i18n/routing", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/trpc/react", () => ({
  api: {
    spotifyAdmin: {
      getConnectionStatus: {
        useQuery: (): MockQueryResult<SpotifyConnectionStatusData> =>
          mockGetConnectionStatus(),
      },
      getRedirectUri: {
        useQuery: (): MockQueryResult<SpotifyRedirectUriData> =>
          mockGetRedirectUri(),
      },
    },
  },
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("./spotify-connect-form", () => ({
  __esModule: true,
  default: () => <div>Connect form</div>,
}));

jest.mock("./spotify-connection-status", () => ({
  __esModule: true,
  default: () => <div>Connection status</div>,
}));

describe("SpotifyConnectPage", () => {
  beforeEach(() => {
    mockGetRedirectUri.mockReturnValue({
      isLoading: false,
      data: { redirectUri: "http://127.0.0.1:3000/api/spotify/callback" },
    });
  });

  it("shows connect form when disconnected", () => {
    mockGetConnectionStatus.mockReturnValue({
      isLoading: false,
      data: {
        status: "disconnected",
        clientId: null,
        connectedAt: null,
        lastRefreshErrorAt: null,
        scope: null,
      },
    });

    renderWithIntl(<SpotifyConnectPage />);

    expect(screen.getByText("Connect form")).toBeInTheDocument();
    expect(
      screen.getByText(/Spotify recommends storing refresh tokens/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /privacy policy/i }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("hides connect form when connected", () => {
    mockGetConnectionStatus.mockReturnValue({
      isLoading: false,
      data: {
        status: "connected",
        clientId: "abc",
        connectedAt: new Date(),
        lastRefreshErrorAt: null,
        scope: null,
      },
    });

    renderWithIntl(<SpotifyConnectPage />);

    expect(screen.queryByText("Connect form")).not.toBeInTheDocument();
    expect(screen.getByText("Connection status")).toBeInTheDocument();
  });
});
