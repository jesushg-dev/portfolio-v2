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
        error={{ message: "LLM quota exceeded" }}
        effectiveMode="auto"
        hasAutoProviders={true}
        onRetry={onRetry}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("LLM quota exceeded")).toBeVisible();

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the rejected change and keeps the internal field ID in technical details", () => {
    const fieldId = "experience.exp-0.bullet.resp-0-2";
    renderWithIntl(
      <ResumeTailorErrorAlert
        error={{
          message: `Resume validation failed: ${fieldId}`,
          validation: [
            {
              fieldId,
              field: "bullet",
              context: "Acme · Software Engineer",
              bullet: 2,
              original: "Reduced response times by 25%.",
              proposed: "Reduced response times by 50%.",
              reason: "numericFacts",
              numericFacts: { original: ["25%"], proposed: ["50%"] },
            },
          ],
        }}
        effectiveMode="manual"
        hasAutoProviders={false}
        onRetry={jest.fn()}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
      />,
    );

    expect(
      screen.getByText("Acme · Software Engineer · Bullet 2"),
    ).toBeVisible();
    expect(screen.getByText("Reduced response times by 25%.")).toBeVisible();
    expect(screen.getByText("Reduced response times by 50%.")).toBeVisible();
    expect(screen.getByText("Values detected: 25%")).toBeVisible();
    expect(screen.getByText("Values detected: 50%")).toBeVisible();
    expect(
      screen.getByText("Technical details").parentElement,
    ).not.toHaveAttribute("open");
  });
});
