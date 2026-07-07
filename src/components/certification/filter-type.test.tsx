import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FilterType from "./filter-type";
import { renderWithIntl } from "@/test-utils/render-with-intl";

describe("FilterType", () => {
  it("renders all certificate type tabs", () => {
    renderWithIntl(<FilterType value={0} onChange={jest.fn()} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Cybersecurity")).toBeInTheDocument();
    expect(screen.getByText("Soft Skills")).toBeInTheDocument();
  });

  it("calls onChange when a tab is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderWithIntl(<FilterType value={0} onChange={onChange} />);
    await user.click(screen.getByText("Frontend"));
    expect(onChange).toHaveBeenCalled();
  });
});
