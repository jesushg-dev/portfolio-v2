import { render, screen } from "@testing-library/react";
import React from "react";
import HeaderCV from "./index";
import ClientImage from "./client-image";

describe("ClientImage", () => {
  it("renders an image with custom alt text", () => {
    render(
      <ClientImage src="https://example.com/pic.jpg" alt="Profile photo" />,
    );
    const img = screen.getByAltText("Profile photo");
    expect(img).toBeInTheDocument();
  });

  it("renders default alt text when alt is omitted", () => {
    render(<ClientImage src="https://example.com/pic.jpg" />);
    const img = screen.getByAltText("Client Image");
    expect(img).toBeInTheDocument();
  });
});

describe("HeaderCV", () => {
  it("renders header degree and fullName when header data is provided", () => {
    render(
      <HeaderCV
        header={
          {
            fullName: "John Doe",
            degree: { default: "Software Engineer" },
            photoUrl: "https://example.com/john.jpg",
            clientImageAlt: "Photo of John",
          } as unknown as Parameters<typeof HeaderCV>[0]["header"]
        }
        locale="en"
        defaultLocale="en"
      />,
    );

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByAltText("Photo of John")).toBeInTheDocument();
  });

  it("falls back to fallbackName when header fullName is missing", () => {
    render(
      <HeaderCV
        header={
          {
            degree: "Developer",
          } as unknown as Parameters<typeof HeaderCV>[0]["header"]
        }
        fallbackName="Jane Doe"
        locale="en"
        defaultLocale="en"
      />,
    );

    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders empty string when fullName and fallbackName are missing", () => {
    const { container } = render(
      <HeaderCV header={null} locale="en" defaultLocale="en" />,
    );

    expect(container).toBeInTheDocument();
  });

  it("omits photoUrl section when photoUrl is missing", () => {
    render(
      <HeaderCV
        header={
          {
            fullName: "No Photo Person",
          } as unknown as Parameters<typeof HeaderCV>[0]["header"]
        }
        locale="en"
        defaultLocale="en"
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
  });
});
