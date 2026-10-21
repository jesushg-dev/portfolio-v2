import { render, screen } from "@testing-library/react";
import React from "react";
import { LinkPreview } from "./link-preview";

describe("LinkPreview component", () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });
  it("renders external link with anchor and target blank", () => {
    render(
      <LinkPreview url="https://github.com/jesushg-dev">
        GitHub Profile
      </LinkPreview>,
    );

    const link = screen.getByRole("link", { name: "GitHub Profile" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/jesushg-dev");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders internal link with proper href", () => {
    render(<LinkPreview url="/certificates">Certificados</LinkPreview>);

    const link = screen.getByRole("link", { name: "Certificados" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/certificates");
  });

  it("accepts custom imageSrc and imageAlt", () => {
    render(
      <LinkPreview
        url="/timeline"
        imageSrc="/custom-preview.webp"
        imageAlt="Mi línea de tiempo"
      >
        Línea de tiempo
      </LinkPreview>,
    );

    const link = screen.getByRole("link", { name: "Línea de tiempo" });
    expect(link).toBeInTheDocument();
  });
});
