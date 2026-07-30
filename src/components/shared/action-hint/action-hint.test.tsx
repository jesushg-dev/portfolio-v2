import { screen, fireEvent, waitFor } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";

import { ActionHint } from "./action-hint";

describe("ActionHint", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders children and shows hint when delay is 0", async () => {
    renderWithIntl(
      <ActionHint delay={0} label="Tap to open">
        <button type="button">Artwork</button>
      </ActionHint>,
    );

    expect(screen.getByRole("button", { name: "Artwork" })).toBeInTheDocument();
    expect(await screen.findByText("Tap to open")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dismiss hint" }),
    ).toBeInTheDocument();
  });

  it("dismisses hint when close button inside bubble is clicked", async () => {
    renderWithIntl(
      <ActionHint delay={0} label="Tap to open">
        <button type="button">Artwork</button>
      </ActionHint>,
    );

    const closeBtn = await screen.findByRole("button", {
      name: "Dismiss hint",
    });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Tap to open")).not.toBeInTheDocument();
    });
  });
});
