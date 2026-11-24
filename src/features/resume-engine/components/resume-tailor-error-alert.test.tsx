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

  it("asks whether mismatched technology names are equivalent and renders the AI correction prompt", () => {
    const onConfirmEquivalence = jest.fn();
    const onRejectEquivalence = jest.fn();
    const pair = { original: "REST APIs", proposed: "RESTful APIs" };

    renderWithIntl(
      <ResumeTailorErrorAlert
        error={{
          message:
            "Resume validation failed: Technology name “REST APIs” → “RESTful APIs”: display name belongs to a different technology.",
          validation: [
            {
              fieldId: "technologyNames[0]",
              field: "technologyName",
              original: pair.original,
              proposed: pair.proposed,
              reason: "technologyIdentity",
            },
          ],
        }}
        effectiveMode="manual"
        hasAutoProviders={false}
        correctionPrompt={{
          systemPrompt: "sys",
          userPrompt: "usr",
          combinedPrompt:
            'SYSTEM:\nsys\n\nUSER:\nusr\n\nUSER DECISIONS:\n- "REST APIs" and "RESTful APIs" are DIFFERENT technologies',
        }}
        onRetry={jest.fn()}
        onClearError={jest.fn()}
        onSwitchToManual={jest.fn()}
        onConfirmEquivalence={onConfirmEquivalence}
        onRejectEquivalence={onRejectEquivalence}
        onCreateCorrectionPrompt={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Do “REST APIs” and “RESTful APIs” refer to the same technology?",
      ),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Yes, they’re equivalent & continue",
      }),
    );
    expect(onConfirmEquivalence).toHaveBeenCalledWith(pair);

    fireEvent.click(
      screen.getByRole("button", { name: "No, create AI correction prompt" }),
    );
    expect(onRejectEquivalence).toHaveBeenCalledWith(pair);

    expect(screen.getByText("AI correction prompt")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Copy correction prompt" }),
    ).toBeVisible();
  });
});
