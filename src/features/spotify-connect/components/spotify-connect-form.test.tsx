import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import SpotifyConnectForm from "./spotify-connect-form";

jest.mock("@/trpc/react", () => ({
  api: {
    spotifyAdmin: {
      initiateConnect: {
        useMutation: () => ({
          mutateAsync: jest.fn(),
          isPending: false,
          error: null,
        }),
      },
    },
  },
}));

describe("SpotifyConnectForm", () => {
  it("renders Client ID and Client Secret form inputs", () => {
    renderWithIntl(<SpotifyConnectForm />);

    expect(screen.getByText(/Client ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Client Secret/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect with Spotify/i }),
    ).toBeInTheDocument();
  });
});
