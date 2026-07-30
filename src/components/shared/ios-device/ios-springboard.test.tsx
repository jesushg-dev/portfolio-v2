import { render, screen, fireEvent } from "@testing-library/react";
import { IOSSpringBoard } from "./ios-springboard";

describe("IOSSpringBoard", () => {
  it("renders app icons and responds to clicks", () => {
    const handleOpenApp = jest.fn();
    render(<IOSSpringBoard onOpenApp={handleOpenApp} />);

    expect(screen.getByText("Spotify")).toBeInTheDocument();
    expect(screen.getByText("Terminal")).toBeInTheDocument();

    // Click Spotify app icon
    fireEvent.click(screen.getByText("Spotify"));
    expect(handleOpenApp).toHaveBeenCalledWith("spotify");
  });
});
