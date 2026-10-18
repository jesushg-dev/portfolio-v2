import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImageLightbox } from "./image-lightbox";

describe("ImageLightbox", () => {
  it("does not render portal content when isOpen is false", () => {
    render(
      <ImageLightbox
        isOpen={false}
        onClose={jest.fn()}
        src="https://example.com/test.png"
        alt="Test Image"
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders image and title when isOpen is true", () => {
    render(
      <ImageLightbox
        isOpen={true}
        onClose={jest.fn()}
        src="https://example.com/test.png"
        alt="Test Image"
        title="Custom Title"
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByAltText("Test Image")).toBeInTheDocument();
  });

  it("calls onClose when clicking close button", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <ImageLightbox
        isOpen={true}
        onClose={onClose}
        src="https://example.com/test.png"
        alt="Test Image"
        closeAriaLabel="Close modal"
      />,
    );
    await user.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key press", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <ImageLightbox
        isOpen={true}
        onClose={onClose}
        src="https://example.com/test.png"
        alt="Test Image"
      />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });
});
