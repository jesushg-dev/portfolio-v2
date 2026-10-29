import { fireEvent, screen } from "@testing-library/react";
import React from "react";
import { ServicesBento, type ServiceItem } from "./services-bento";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("ServicesBento", () => {
  it("renders nothing when the tenant has no services", () => {
    const { container } = renderWithIntl(<ServicesBento dbServices={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders tenant service cards and contact CTA", () => {
    renderWithIntl(
      <ServicesBento
        dbServices={[
          {
            id: "svc-1",
            type: "FRONTEND",
            image: "",
            title: "Tenant Frontend",
            description: "Only this tenant's copy",
          },
        ]}
      />,
    );

    expect(screen.getByText("Tenant Frontend")).toBeInTheDocument();
    expect(screen.queryByText(/Cybersecurity/i)).not.toBeInTheDocument();
  });

  it("limits display to 5 services (two rows) and toggles with see more button", () => {
    const mockServices: ServiceItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: `svc-${i + 1}`,
      type: "FRONTEND",
      image: "",
      title: `Service Title ${i + 1}`,
      description: `Description ${i + 1}`,
    }));

    renderWithIntl(<ServicesBento dbServices={mockServices} />);

    // First 5 services visible
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Service Title ${i}`)).toBeInTheDocument();
    }
    // 6th service is hidden initially
    expect(screen.queryByText("Service Title 6")).not.toBeInTheDocument();

    // "See more" button is visible
    const toggleButton = screen.getByRole("button", { name: /see more/i });
    expect(toggleButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(toggleButton);

    // 6th service is now visible
    expect(screen.getByText("Service Title 6")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /see less/i }),
    ).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByRole("button", { name: /see less/i }));
    expect(screen.queryByText("Service Title 6")).not.toBeInTheDocument();
  });
});
