import { screen } from "@testing-library/react";
import React from "react";
import { ServicesBento } from "./services-bento";
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
});
