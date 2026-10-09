import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeTailorErrorAlert } from "./resume-tailor-error-alert";

describe("ResumeTailorErrorAlert", () => {
  it("renders null when there is no error", () => {
    const { container } = renderWithIntl(
      <ResumeTailorErrorAlert
        error={null}
        effectiveMode="auto"
        hasAutoProviders={true}
        onRetry={jest.fn()}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders error message and triggers retry handler", () => {
    const onRetry = jest.fn();

    renderWithIntl(
      <ResumeTailorErrorAlert
        error="LLM quota exceeded"
        effectiveMode="auto"
        hasAutoProviders={true}
        onRetry={onRetry}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getAllByText("LLM quota exceeded").length).toBeGreaterThan(0);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
