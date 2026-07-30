import { render, screen } from "@testing-library/react";
import { IOSDeviceMockup } from "./ios-device-mockup";

describe("IOSDeviceMockup", () => {
  it("renders children inside device screen", () => {
    render(
      <IOSDeviceMockup>
        <div data-testid="app-content">App inside Phone</div>
      </IOSDeviceMockup>,
    );

    expect(screen.getByTestId("app-content")).toBeInTheDocument();
    expect(screen.getByTestId("app-content")).toHaveTextContent(
      "App inside Phone",
    );
  });
});
