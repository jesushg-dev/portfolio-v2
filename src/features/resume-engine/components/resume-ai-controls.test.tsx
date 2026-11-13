import { fireEvent, screen } from "@testing-library/react";

import { renderWithIntl } from "@/test-utils/render-with-intl";
import { ResumeAiControls } from "./resume-ai-controls";

describe("ResumeAiControls", () => {
  it("renders AI mode options using unified option cards", () => {
    const onModeChange = jest.fn();
    const onProviderChange = jest.fn();

    renderWithIntl(
      <ResumeAiControls
        mode="manual"
        onModeChange={onModeChange}
        provider="openai"
        onProviderChange={onProviderChange}
        providers={[{ id: "openai", label: "OpenAI", model: "gpt-4o" }]}
        defaultProvider="openai"
        hasAutoProviders={true}
      />,
    );

    const radiogroup = screen.getByRole("radiogroup");
    expect(radiogroup).toBeInTheDocument();

    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(2);

    // Manual is selected
    expect(options[1]).toHaveAttribute("aria-checked", "true");
    expect(options[0]).toHaveAttribute("aria-checked", "false");

    // Click Auto
    fireEvent.click(options[0]);
    expect(onModeChange).toHaveBeenCalledWith("auto");
  });

  it("disables automatic mode when no auto providers are configured", () => {
    const onModeChange = jest.fn();
    const onProviderChange = jest.fn();

    renderWithIntl(
      <ResumeAiControls
        mode="manual"
        onModeChange={onModeChange}
        provider={null}
        onProviderChange={onProviderChange}
        providers={[]}
        defaultProvider={null}
        hasAutoProviders={false}
      />,
    );

    const options = screen.getAllByRole("radio");
    expect(options[0]).toBeDisabled();
    expect(options[0]).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(options[0]);
    expect(onModeChange).not.toHaveBeenCalled();
  });
});

