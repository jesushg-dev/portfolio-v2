import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Tab from "./index";
import TabItem from "./tab-item";

const DummyIcon = () => <svg data-testid="dummy-icon" />;

describe("Tab & TabItem components", () => {
  it("renders tab items and handles tab switching", () => {
    const setCurrentTab = jest.fn();
    render(
      <Tab
        ariaLabel="Main tabs"
        currentTab={0}
        setCurrentTab={setCurrentTab}
        tabId="test-tabs"
      >
        <TabItem icon={DummyIcon} title="Tab 1" />
        <TabItem icon={DummyIcon} title="Tab 2" />
      </Tab>,
    );

    const tablist = screen.getByRole("tablist", { name: "Main tabs" });
    expect(tablist).toBeInTheDocument();
    expect(tablist.className).toContain("overflow-visible");
    expect(tablist.className).not.toContain("overflow-x-auto");
    const tab1 = screen.getByRole("tab", { name: /Tab 1/ });
    const tab2 = screen.getByRole("tab", { name: /Tab 2/ });

    expect(tab1).toHaveAttribute("aria-selected", "true");
    expect(tab2).toHaveAttribute("aria-selected", "false");

    fireEvent.click(tab2);
    expect(setCurrentTab).toHaveBeenCalledWith(1);
  });

  it("renders the canonical pill layout", () => {
    render(
      <Tab ariaLabel="Pill tabs" currentTab={0}>
        <TabItem icon={DummyIcon} title="Min Tab 1" />
      </Tab>,
    );

    expect(screen.getByText("Min Tab 1")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Min Tab 1/ })).toHaveClass(
      "rounded-full",
    );
  });

  it("stacks the icon above the label on narrow screens", () => {
    render(
      <Tab ariaLabel="Stacked tabs" currentTab={0}>
        <TabItem icon={DummyIcon} title="All" />
      </Tab>,
    );

    const tab = screen.getByRole("tab", { name: /All/ });
    expect(tab.className).toContain("flex-col");
    expect(tab.firstElementChild?.className).toContain("flex-col");
  });

  it("gives pill tab items a mobile min-width on the measured wrapper", () => {
    render(
      <Tab ariaLabel="Sized tabs" currentTab={0}>
        <TabItem icon={DummyIcon} title="All" />
      </Tab>,
    );

    const tab = screen.getByRole("tab", { name: /All/ });
    expect(tab.parentElement?.className).toContain("min-w-18");
    expect(tab.parentElement?.className).toContain("sm:min-w-0");
    expect(tab.className).toContain("w-full");
  });

  it("handles pointer down and pointer up on active tab cleanly without getting stuck", () => {
    const setCurrentTab = jest.fn();
    render(
      <Tab
        ariaLabel="Interactive tabs"
        currentTab={0}
        setCurrentTab={setCurrentTab}
        tabId="test-tabs"
      >
        <TabItem icon={DummyIcon} title="Active Tab" />
        <TabItem icon={DummyIcon} title="Other Tab" />
      </Tab>,
    );

    const activeTab = screen.getByRole("tab", { name: /Active Tab/ });
    const otherTab = screen.getByRole("tab", { name: /Other Tab/ });

    // Press down on active tab
    fireEvent.pointerDown(activeTab, { button: 0 });
    // Release pointer anywhere on window
    fireEvent.pointerUp(window);

    // Clicking other tab should immediately work
    fireEvent.click(otherTab);
    expect(setCurrentTab).toHaveBeenCalledWith(1);
  });

  it("throws error when invalid children are passed", () => {
    const spy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => {
      render(
        <Tab ariaLabel="Invalid tabs">
          <div>Invalid child div</div>
        </Tab>,
      );
    }).toThrow("Tab component only accepts TabItem components as children");
    spy.mockRestore();
  });
});
