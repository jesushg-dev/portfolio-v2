import { render, screen, fireEvent } from "@testing-library/react";

import ProjectCoverImage from "./project-cover-image";

describe("ProjectCoverImage", () => {
  it("renders image initially", () => {
    render(
      <ProjectCoverImage
        src="https://example.com/hero.png"
        alt="Hero Project"
        fallbackTitle="Hero Project"
      />,
    );

    expect(screen.getByAltText("Hero Project")).toBeInTheDocument();
  });

  it("renders fallback container when image triggers error event", () => {
    render(
      <ProjectCoverImage
        src="https://example.com/broken.png"
        alt="Broken Image"
        fallbackTitle="Fallback Project"
      />,
    );

    const img = screen.getByAltText("Broken Image");
    fireEvent.error(img);

    expect(screen.queryByAltText("Broken Image")).not.toBeInTheDocument();
    expect(screen.getByText("Fallback Project")).toBeInTheDocument();
  });
});
