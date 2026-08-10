import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { ActionHint } from "./action-hint";

jest.mock("@/i18n/routing", () => ({
  usePathname: () => "/",
}));

describe("ActionHint", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.body.dataset.overlayLock;
  });

  it("renders children and shows hint when delay is 0", async () => {
    const { unmount } = renderWithIntl(
      <ActionHint delay={0} label="Tap to open">
        <button type="button">Artwork</button>
      </ActionHint>,
    );

    expect(screen.getByRole("button", { name: "Artwork" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Tap to open")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Dismiss hint" }),
    ).toBeInTheDocument();

    unmount();
  });

  it("dismisses hint when close button inside bubble is clicked", async () => {
    const { unmount } = renderWithIntl(
      <ActionHint delay={0} label="Tap to open">
        <button type="button">Artwork</button>
      </ActionHint>,
    );

    const closeBtn = await screen.findByRole("button", {
      name: "Dismiss hint",
    });
    fireEvent.pointerDown(closeBtn);
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Tap to open")).not.toBeInTheDocument();
    });

    unmount();
  });

  it("dismisses hint when artwork child is clicked", async () => {
    const { unmount } = renderWithIntl(
      <ActionHint delay={0} label="Tap to open">
        <button type="button">Artwork</button>
      </ActionHint>,
    );

    const artworkBtn = screen.getByRole("button", { name: "Artwork" });
    fireEvent.click(artworkBtn);

    await waitFor(() => {
      expect(screen.queryByText("Tap to open")).not.toBeInTheDocument();
    });

    unmount();
  });
});
