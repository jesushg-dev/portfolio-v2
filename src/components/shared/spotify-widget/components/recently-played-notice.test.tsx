import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import RecentlyPlayedNotice from "./recently-played-notice";

describe("RecentlyPlayedNotice", () => {
  it("renders non-compact notice", () => {
    renderWithIntl(<RecentlyPlayedNotice locale="en" />);
    expect(
      screen.getByText(/Nothing is playing right now/i),
    ).toBeInTheDocument();
  });

  it("renders compact notice with relative time", () => {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    renderWithIntl(
      <RecentlyPlayedNotice playedAt={tenMinsAgo} locale="en" compact />,
    );
    expect(
      screen.getByText(/Nothing is playing right now/i),
    ).toBeInTheDocument();
  });
});
