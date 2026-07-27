import { render, screen } from "@testing-library/react";
import React from "react";
import AdditionalInformation from "./additional-information";

describe("AdditionalInformation", () => {
  it("renders null when additionalInformation is empty array", () => {
    const { container } = render(
      <AdditionalInformation additionalInformation={[]} locale="en" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders additional information list when items are provided", () => {
    const items = [
      { id: "1", text: { default: "Certified Kubernetes Administrator" } },
      { id: "2", text: "Speaker at TechConf 2023" },
    ];

    render(
      <AdditionalInformation
        additionalInformation={items}
        locale="en"
        defaultLocale="en"
      />,
    );

    expect(
      screen.getByText(/Certified Kubernetes Administrator/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Speaker at TechConf 2023/)).toBeInTheDocument();
  });
});
