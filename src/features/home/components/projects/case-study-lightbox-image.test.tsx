import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { CaseStudyLightboxImage } from "./case-study-lightbox-image";

describe("CaseStudyLightboxImage", () => {
  const defaultProps = {
    src: "https://example.com/project.png",
    alt: "E-Commerce Platform",
  };

  it("renders thumbnail trigger button", () => {
    renderWithIntl(<CaseStudyLightboxImage {...defaultProps} />);
    const trigger = screen.getByRole("button", {
      name: /E-Commerce Platform/i,
    });
    expect(trigger).toBeInTheDocument();
  });

  it("opens lightbox when clicking trigger button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CaseStudyLightboxImage {...defaultProps} />);

    expect(screen.queryByRole("dialog")).toBeNull();

    const trigger = screen.getByRole("button", {
      name: /E-Commerce Platform/i,
    });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes lightbox on Escape key", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CaseStudyLightboxImage {...defaultProps} />);

    const trigger = screen.getByRole("button", {
      name: /E-Commerce Platform/i,
    });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
