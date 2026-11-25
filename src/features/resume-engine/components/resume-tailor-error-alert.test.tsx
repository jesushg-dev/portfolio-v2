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

  it("supports batch Yes/No decisions for multiple mismatched technology names without repeating prose", () => {
    const onResolveEquivalences = jest.fn();
    const restPair = { original: "REST APIs", proposed: "RESTful APIs" };
    const pgPair = { original: "Postgres", proposed: "PostgreSQL" };

    renderWithIntl(
      <ResumeTailorErrorAlert
        error={{
          message: "Resume validation failed",
          validation: [
            {
              fieldId: "technologyNames[0]",
              field: "technologyName",
              original: restPair.original,
              proposed: restPair.proposed,
              reason: "technologyIdentity",
            },
            {
              fieldId: "technologyNames[1]",
              field: "technologyName",
              original: pgPair.original,
              proposed: pgPair.proposed,
              reason: "technologyIdentity",
            },
          ],
        }}
        effectiveMode="manual"
        hasAutoProviders={false}
        correctionPrompt={{
          systemPrompt: "sys",
          userPrompt: "usr",
          combinedPrompt: "SYSTEM:\nsys\n\nUSER:\nfix",
        }}
        onRetry={jest.fn()}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
        onResolveEquivalences={onResolveEquivalences}
        onCreateCorrectionPrompt={jest.fn()}
      />,
    );

    expect(screen.getAllByText("Same technology?")).toHaveLength(2);

    const yesButtons = screen.getAllByRole("button", { name: "Yes" });
    const noButtons = screen.getAllByRole("button", { name: "No" });
    fireEvent.click(yesButtons[0]);
    fireEvent.click(noButtons[1]);

    fireEvent.click(
      screen.getByRole("button", { name: "Create AI correction prompt" }),
    );
    expect(onResolveEquivalences).toHaveBeenCalledWith({
      approved: [restPair],
      rejected: [pgPair],
    });

    fireEvent.click(
      screen.getByRole("button", { name: "All equivalent & continue" }),
    );
    expect(onResolveEquivalences).toHaveBeenCalledWith({
      approved: [restPair, pgPair],
      rejected: [],
    });

    expect(screen.getByText("AI correction prompt")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy correction prompt" }),
    ).toBeVisible();
  });
});
