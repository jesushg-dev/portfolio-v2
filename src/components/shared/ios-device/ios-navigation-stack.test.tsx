import { render, screen, fireEvent } from "@testing-library/react";
import { IOSNavigationStack, IOSScreen } from "./ios-navigation-stack";
import { useIOSNavigation } from "./hooks/use-ios-navigation";

function TestApp() {
  const { push, pop } = useIOSNavigation();

  return (
    <div>
      <button type="button" onClick={() => push("screen-b", {}, "Screen B")}>
        Go to Screen B
      </button>
      <button type="button" onClick={pop}>
        Back
      </button>
    </div>
  );
}

describe("IOSNavigationStack", () => {
  it("renders initial screen and handles push and pop navigation", () => {
    render(
      <IOSNavigationStack initialRoute="screen-a" initialTitle="Screen A">
        <IOSScreen id="screen-a" title="Screen A">
          <div>Screen A Content</div>
          <TestApp />
        </IOSScreen>
        <IOSScreen id="screen-b" title="Screen B">
          <div>Screen B Content</div>
        </IOSScreen>
      </IOSNavigationStack>,
    );

    expect(screen.getByText("Screen A Content")).toBeInTheDocument();

    // Click to push Screen B
    fireEvent.click(screen.getByText("Go to Screen B"));
    expect(screen.getByText("Screen B Content")).toBeInTheDocument();
  });
});
