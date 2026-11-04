import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ServicesCarousel, type ExpertiseItem } from "./services-carousel";

const service: ExpertiseItem = {
  id: "tenant-service",
  title: "Tenant engineering",
  description: "<img src=x onerror=alert(1)>",
  type: "FRONTEND",
  image: "",
  icon: "code",
  visualType: "network",
  visualNodes: [{ label: "Tenant API" }],
  featured: false,
  order: 0,
  badge: "Custom category",
  statsValue: "",
  statsLabel: "",
  practicePoints: ["Evidence from the administrator"],
  technologies: [{ id: "react", title: "React" }],
};

describe("ServicesCarousel", () => {
  it("does not fabricate services for an empty tenant", () => {
    const { container } = renderWithIntl(<ServicesCarousel dbServices={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uses tenant data and renders admin content as text, never HTML", () => {
    const { container } = renderWithIntl(
      <ServicesCarousel dbServices={[service]} />,
    );
    expect(screen.getByText(service.title)).toBeInTheDocument();
    expect(screen.getByText(service.description)).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByText("Backend & APIs")).not.toBeInTheDocument();
  });

  it("shows localized evidence and technologies in an accessible dialog", async () => {
    renderWithIntl(<ServicesCarousel dbServices={[service]} />);
    fireEvent.click(
      screen.getByRole("button", {
        name: "View details for Tenant engineering",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: service.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(service.practicePoints[0])).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
