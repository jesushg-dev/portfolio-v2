import { renderHook } from "@testing-library/react";
import React from "react";
import TabContextProvider, { useTabContext } from "./tab-context-provider";

describe("TabContextProvider and useTabContext", () => {
  it("provides tab context values to children", () => {
    const setCurrentTab = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TabContextProvider
        tabId="test-tab-id"
        tabCount={3}
        minimal={true}
        vertical={false}
        variant="primary"
        currentTab={1}
        setCurrentTab={setCurrentTab}
      >
        {children}
      </TabContextProvider>
    );

    const { result } = renderHook(() => useTabContext(), { wrapper });

    expect(result.current.tabId).toBe("test-tab-id");
    expect(result.current.tabCount).toBe(3);
    expect(result.current.minimal).toBe(true);
    expect(result.current.variant).toBe("primary");
    expect(result.current.currentTab).toBe(1);

    result.current.setCurrentTab(2);
    expect(setCurrentTab).toHaveBeenCalledWith(2);
  });

  it("throws an error when useTabContext is called outside TabContextProvider", () => {
    const spy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(() => {
      renderHook(() => useTabContext());
    }).toThrow("useTabContext must be used within a TabProvider");
    spy.mockRestore();
  });
});
