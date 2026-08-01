import { screen } from "@testing-library/react";
import React from "react";
import { ServicesBento } from "./services-bento";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("ServicesBento", () => {
  it("renders all service cards and contact CTA card correctly", () => {
    renderWithIntl(<ServicesBento dbServices={[]} />);

    expect(screen.getAllByText(/Frontend & UI\/UX/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Backend & APIs/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mobile/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/DevOps & Cloud/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cybersecurity/i).length).toBeGreaterThan(0);
  });
});
