import { render, screen } from "@testing-library/react";
import { HomeTechMarquee } from "./home-tech-marquee";

describe("HomeTechMarquee", () => {
  it("renders nothing without tenant skills", () => {
    const { container } = render(<HomeTechMarquee />);
    expect(container).toBeEmptyDOMElement();
  });
  it("renders the tenant skills without fabricating technologies", () => {
    render(
      <HomeTechMarquee
        items={[
          { id: "1", title: "Rust" },
          { id: "2", title: "Go" },
        ]}
      />,
    );
    expect(screen.getAllByText("Rust").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Go").length).toBeGreaterThan(0);
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });
  it("omits blank skills", () => {
    const { container } = render(<HomeTechMarquee items={[" "]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
