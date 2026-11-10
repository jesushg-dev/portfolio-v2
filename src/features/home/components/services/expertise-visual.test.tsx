import { render } from "@testing-library/react";
import { ExpertiseVisual } from "./expertise-visual";
import { serviceVisualTypes } from "@/features/services/lib/service-visual";

it.each(serviceVisualTypes)(
  "renders the %s diagram as safe SVG with translated database labels",
  (visualType) => {
    const label = "<img src=x onerror=alert(1)>";
    const { container } = render(
      <ExpertiseVisual visualType={visualType} nodes={[{ label }]} />,
    );
    expect(
      container.querySelector(`svg[data-visual-type="${visualType}"]`),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll("rect, path, circle").length,
    ).toBeGreaterThan(5);
    expect(container.querySelector("text")?.textContent).toBe(label);
    expect(container.querySelector("img, script, foreignObject")).toBeNull();
  },
);
